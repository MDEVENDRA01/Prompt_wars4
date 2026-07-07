const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const db = require('./database');
const simulator = require('./simulator');
const ai = require('./ai');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Create Server
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // For development, allow any client
    methods: ['GET', 'POST', 'PATCH']
  }
});

// REST API Routes

app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>StadiumIQ Backend Terminal</title>
        <style>
          body { font-family: system-ui, -apple-system, sans-serif; text-align: center; padding: 60px 20px; background-color: #F7F9FB; color: #0F2C4C; }
          .card { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(15, 44, 76, 0.08); border: 1px solid #e2e8f0; }
          h1 { margin-bottom: 12px; font-weight: 800; }
          p { color: #64748b; font-size: 14px; line-height: 1.6; margin-bottom: 24px; }
          a { background-color: #00A651; color: white; font-weight: bold; text-decoration: none; padding: 12px 24px; border-radius: 10px; display: inline-block; transition: background-color 0.2s; }
          a:hover { background-color: #008f44; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>StadiumIQ Backend is Online</h1>
          <p>This port (3001) hosts the SQLite database telemetry, WebSocket broadcasts, and Claude AI logic. To view the user dashboards, navigate to port 3000.</p>
          <a href="http://localhost:3000">Open StadiumIQ Dashboard (Port 3000)</a>
        </div>
      </body>
    </html>
  `);
});

// 1. Zones
app.get('/api/zones', async (req, res) => {
  try {
    const zones = await db.all('SELECT * FROM zones');
    res.json(zones);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Transport Options
app.get('/api/transport', async (req, res) => {
  try {
    const transport = await db.all('SELECT * FROM transport_options');
    res.json(transport);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Incidents
app.get('/api/incidents', async (req, res) => {
  try {
    const incidents = await db.all('SELECT * FROM incidents ORDER BY timestamp DESC');
    res.json(incidents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/incidents', async (req, res) => {
  try {
    const { reporter_id, zone_id, category, description } = req.value || req.body;
    const id = `inc-${uuidv4().substring(0, 8)}`;

    // Determine Urgency Score via rule-based AI / heuristics or fallback API
    let urgencyScore = 5;
    const desc = (description || '').toLowerCase();
    if (category === 'medical' || desc.includes('pain') || desc.includes('injury') || desc.includes('unconscious') || desc.includes('bleeding')) {
      urgencyScore = 9;
    } else if (category === 'crowd' || desc.includes('surge') || desc.includes('block') || desc.includes('crush') || desc.includes('gate closed')) {
      urgencyScore = 7;
    } else if (desc.includes('water') || desc.includes('leak') || desc.includes('slip') || desc.includes('broken')) {
      urgencyScore = 4;
    } else if (desc.includes('lost') || desc.includes('bag') || desc.includes('wallet')) {
      urgencyScore = 2;
    }

    await db.run(
      `INSERT INTO incidents (id, reporter_id, zone_id, category, description, ai_urgency_score, status)
       VALUES (?, ?, ?, ?, ?, ?, 'new')`,
      [id, reporter_id || 'anonymous', zone_id, category, description, urgencyScore]
    );

    const newIncident = await db.get('SELECT * FROM incidents WHERE id = ?', [id]);
    const allIncidents = await db.all('SELECT * FROM incidents ORDER BY timestamp DESC');

    // Broadcast update via WebSockets
    io.emit('incident_update', allIncidents);

    res.status(201).json(newIncident);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/incidents/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!['new', 'in_progress', 'resolved'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    await db.run('UPDATE incidents SET status = ? WHERE id = ?', [status, id]);
    const updated = await db.get('SELECT * FROM incidents WHERE id = ?', [id]);
    const allIncidents = await db.all('SELECT * FROM incidents ORDER BY timestamp DESC');

    // Broadcast updates
    io.emit('incident_update', allIncidents);

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Sustainability
app.get('/api/sustainability', async (req, res) => {
  try {
    const metrics = await db.all('SELECT * FROM sustainability_metrics');
    res.json(metrics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/sustainability/recycle', async (req, res) => {
  try {
    const { amount = 5, unit = 'lbs' } = req.body;
    // Update waste
    await db.run(
      "UPDATE sustainability_metrics SET value = value + ? WHERE metric_type = 'waste'",
      [amount]
    );
    const updatedMetrics = await db.all('SELECT * FROM sustainability_metrics');
    io.emit('sustainability_update', updatedMetrics);
    res.json({ message: 'Recycling recorded! Thank you for keeping our stadium clean.', metrics: updatedMetrics });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Alerts
app.get('/api/alerts', async (req, res) => {
  try {
    const alerts = await db.all('SELECT * FROM alerts ORDER BY timestamp DESC');
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/alerts', async (req, res) => {
  try {
    const { message, target_role, language } = req.body;
    const id = `alert-${uuidv4().substring(0, 8)}`;

    // Optional Auto-Translate if targeting multiple languages
    let finalMessage = message;
    if (language && language !== 'English') {
      finalMessage = await ai.translateText(message, language);
    }

    await db.run(
      'INSERT INTO alerts (id, message, target_role, language) VALUES (?, ?, ?, ?)',
      [id, finalMessage, target_role || 'all', language || 'English']
    );

    const newAlert = await db.get('SELECT * FROM alerts WHERE id = ?', [id]);
    io.emit('alert_broadcast', newAlert);

    res.status(201).json(newAlert);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. AI Endpoints

app.post('/api/ai/navigate', async (req, res) => {
  try {
    const { message, language = 'English' } = req.body;
    const response = await ai.getWayfindingAdvice(message, language);
    res.json({ response });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ai/accessibility', async (req, res) => {
  try {
    const { message, language = 'English' } = req.body;
    const response = await ai.getAccessibilityAdvice(message, language);
    res.json({ response });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ai/crowd-flow', async (req, res) => {
  try {
    const response = await ai.getCrowdFlowAdvice();
    res.json({ response });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ai/transport', async (req, res) => {
  try {
    const response = await ai.getTransportAdvice();
    res.json({ response });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ai/sustainability', async (req, res) => {
  try {
    const response = await ai.getSustainabilityAdvice();
    res.json({ response });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ai/translate', async (req, res) => {
  try {
    const { text, targetLanguage } = req.body;
    const response = await ai.translateText(text, targetLanguage);
    res.json({ response });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/ai/briefing', async (req, res) => {
  try {
    const response = await ai.getAdminBriefing();
    res.json({ response });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/ai/decision', async (req, res) => {
  try {
    const { scenario } = req.body;
    const response = await ai.getDecisionSupport(scenario);
    res.json({ response });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Socket.io Real-time connection handler
io.on('connection', async (socket) => {
  console.log(`Client connected: ${socket.id}`);

  try {
    // Send initial snapshot of everything immediately on connect
    const zones = await db.all('SELECT * FROM zones');
    const transports = await db.all('SELECT * FROM transport_options');
    const metrics = await db.all('SELECT * FROM sustainability_metrics');
    const incidents = await db.all('SELECT * FROM incidents ORDER BY timestamp DESC');
    const alerts = await db.all('SELECT * FROM alerts ORDER BY timestamp DESC');

    socket.emit('initial_state', {
      zones,
      transports,
      metrics,
      incidents,
      alerts
    });
  } catch (err) {
    console.error('Error sending initial socket state:', err.message);
  }

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Server Bootstrap
async function main() {
  try {
    await db.initDatabase();

    server.listen(port, () => {
      console.log(`StadiumIQ Express backend is running on http://localhost:${port}`);
      // Start IoT simulation loops
      simulator.startSimulator(io);
    });
  } catch (err) {
    console.error('Fatal server start error:', err);
    process.exit(1);
  }
}

main();
