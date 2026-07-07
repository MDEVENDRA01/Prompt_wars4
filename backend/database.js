const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath);

// Helper function to run SQL queries as Promises
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

// Helper to run query returning all rows
function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// Helper to run query returning single row
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// Initialize tables
async function initDatabase() {
  console.log('Initializing SQLite database...');

  await run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    role TEXT CHECK(role IN ('fan', 'volunteer', 'admin')),
    preferred_language TEXT DEFAULT 'English'
  )`);

  await run(`CREATE TABLE IF NOT EXISTS zones (
    id TEXT PRIMARY KEY,
    name TEXT,
    type TEXT CHECK(type IN ('gate', 'concourse', 'seating', 'transport')),
    capacity INTEGER,
    current_count INTEGER,
    accessibility_flags TEXT
  )`);

  await run(`CREATE TABLE IF NOT EXISTS transport_options (
    id TEXT PRIMARY KEY,
    type TEXT CHECK(type IN ('shuttle', 'metro', 'parking')),
    name TEXT,
    zone_id TEXT,
    eta INTEGER,
    load_percent INTEGER
  )`);

  await run(`CREATE TABLE IF NOT EXISTS incidents (
    id TEXT PRIMARY KEY,
    reporter_id TEXT,
    zone_id TEXT,
    category TEXT CHECK(category IN ('medical', 'crowd', 'lost_item', 'technical')),
    description TEXT,
    ai_urgency_score INTEGER CHECK(ai_urgency_score BETWEEN 1 AND 10),
    status TEXT CHECK(status IN ('new', 'in_progress', 'resolved')),
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await run(`CREATE TABLE IF NOT EXISTS sustainability_metrics (
    id TEXT PRIMARY KEY,
    metric_type TEXT CHECK(metric_type IN ('water', 'energy', 'waste')),
    value REAL,
    unit TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await run(`CREATE TABLE IF NOT EXISTS alerts (
    id TEXT PRIMARY KEY,
    message TEXT,
    target_role TEXT CHECK(target_role IN ('fan', 'volunteer', 'admin', 'all')),
    language TEXT DEFAULT 'English',
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await run(`CREATE TABLE IF NOT EXISTS chat_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    message TEXT,
    ai_response TEXT,
    language TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  await seedDatabase();
}

async function seedDatabase() {
  // Check if users table is already populated
  const usersCount = await get('SELECT COUNT(*) as count FROM users');
  if (usersCount.count > 0) {
    console.log('Database already seeded.');
    return;
  }

  console.log('Seeding initial data...');

  // Seed Users
  await run(`INSERT INTO users (id, name, role, preferred_language) VALUES
    ('user-1', 'Alex Mercer', 'fan', 'English'),
    ('user-2', 'Chao Wang', 'fan', 'Chinese'),
    ('user-3', 'Elena Rostova', 'volunteer', 'Russian'),
    ('user-4', 'Carlos Ramos', 'volunteer', 'Spanish'),
    ('user-5', 'Sarah Jenkins', 'admin', 'English')
  `);

  // Seed Zones
  await run(`INSERT INTO zones (id, name, type, capacity, current_count, accessibility_flags) VALUES
    ('zone-gate-a', 'Gate A (North Entrance)', 'gate', 8000, 3200, '["step_free", "wheelchair_ramp"]'),
    ('zone-gate-b', 'Gate B (South Entrance)', 'gate', 8000, 5400, '["step_free", "tactile_paving"]'),
    ('zone-gate-c', 'Gate C (East Concourse)', 'gate', 10000, 7800, '["wheelchair_ramp"]'),
    ('zone-gate-d', 'Gate D (West VIP)', 'gate', 4000, 1100, '["step_free", "wheelchair_ramp", "sensory_quiet"]'),
    ('zone-concourse-l1', 'Concourse Level 1 (Main Food Court)', 'concourse', 12000, 9100, '["step_free", "elevators"]'),
    ('zone-concourse-l2', 'Concourse Level 2 (Merchandise Hub)', 'concourse', 10000, 4300, '["step_free", "elevators"]'),
    ('zone-seating-north', 'Section N (North Stand Seating)', 'seating', 15000, 11200, '[]'),
    ('zone-seating-south', 'Section S (South Stand Seating)', 'seating', 15000, 13800, '[]'),
    ('zone-seating-east', 'Section E (East Stand Seating)', 'seating', 18000, 14200, '["wheelchair_seating"]'),
    ('zone-seating-west', 'Section W (West Stand Seating)', 'seating', 12000, 8900, '["wheelchair_seating"]'),
    ('zone-transport-metro', 'Metro Link Station', 'transport', 25000, 18500, '["step_free", "elevators", "tactile_paving"]'),
    ('zone-transport-shuttle', 'Shuttle Bus Loop (North)', 'transport', 8000, 4500, '["wheelchair_ramp"]'),
    ('zone-transport-p1', 'Main Parking P1 (West)', 'transport', 6000, 5100, '["step_free"]'),
    ('zone-transport-p2', 'Overflow Parking P2 (East)', 'transport', 5000, 1500, '["step_free"]')
  `);

  // Seed Transport Options
  await run(`INSERT INTO transport_options (id, type, name, zone_id, eta, load_percent) VALUES
    ('trans-metro', 'metro', 'Metro Stadium Line', 'zone-transport-metro', 4, 75),
    ('trans-shuttle-a', 'shuttle', 'North Shuttle Express', 'zone-transport-shuttle', 8, 85),
    ('trans-shuttle-b', 'shuttle', 'South Parking Connector', 'zone-transport-shuttle', 12, 40),
    ('trans-parking-p1', 'parking', 'West Lot P1', 'zone-transport-p1', 22, 92),
    ('trans-parking-p2', 'parking', 'East Lot P2', 'zone-transport-p2', 5, 30)
  `);

  // Seed Incidents
  await run(`INSERT INTO incidents (id, reporter_id, zone_id, category, description, ai_urgency_score, status) VALUES
    ('inc-1', 'user-3', 'zone-concourse-l1', 'technical', 'Water puddle causing slip hazard near concession stand B3.', 4, 'new'),
    ('inc-2', 'user-4', 'zone-seating-south', 'medical', 'Spectator experiencing mild heat exhaustion in Section S, Row 12.', 7, 'in_progress'),
    ('inc-3', 'user-3', 'zone-gate-c', 'crowd', 'Queue congestion building up rapidly at Gate C scanner gates.', 6, 'new'),
    ('inc-4', 'user-4', 'zone-concourse-l2', 'lost_item', 'Black leather backpack left unattended under bench 4.', 8, 'resolved')
  `);

  // Seed Sustainability Metrics
  await run(`INSERT INTO sustainability_metrics (id, metric_type, value, unit) VALUES
    ('sust-water-1', 'water', 14200.5, 'gallons'),
    ('sust-energy-1', 'energy', 48900.2, 'kWh'),
    ('sust-waste-1', 'waste', 3540.0, 'lbs')
  `);

  // Seed Initial Alerts
  await run(`INSERT INTO alerts (id, message, target_role, language) VALUES
    ('alert-1', 'Stadium gates are now open. Welcome to FIFA World Cup 2026!', 'all', 'English'),
    ('alert-2', 'Metro service is running on a 4-minute headway. High crowds expected post-match.', 'all', 'English')
  `);

  console.log('Database seeded successfully.');
}

module.exports = {
  initDatabase,
  run,
  all,
  get,
  db
};
