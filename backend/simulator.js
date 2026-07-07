const db = require('./database');

let intervalId = null;

function startSimulator(io) {
  if (intervalId) return;

  console.log('Starting StadiumIQ sensor simulator...');

  intervalId = setInterval(async () => {
    try {
      // 1. Drift Zone Counts
      const zones = await db.all('SELECT * FROM zones');
      for (const zone of zones) {
        const capacity = zone.capacity;
        // Random drift: +/- 1.5% of capacity
        const driftPercent = (Math.random() * 3 - 1.5) / 100;
        const change = Math.round(capacity * driftPercent);
        let newCount = zone.current_count + change;

        // Keep counts between 10% and 95% of capacity to look active
        const minCount = Math.round(capacity * 0.1);
        const maxCount = Math.round(capacity * 0.95);
        if (newCount < minCount) newCount = minCount;
        if (newCount > maxCount) newCount = maxCount;

        await db.run('UPDATE zones SET current_count = ? WHERE id = ?', [newCount, zone.id]);
      }

      // 2. Drift Transport Options
      const transports = await db.all('SELECT * FROM transport_options');
      for (const trans of transports) {
        // ETA drift +/- 1 min (clamp between 2 and 35)
        const etaChange = Math.random() > 0.7 ? (Math.random() > 0.5 ? 1 : -1) : 0;
        let newEta = trans.eta + etaChange;
        if (newEta < 2) newEta = 2;
        if (newEta > 35) newEta = 35;

        // Load percent drift +/- 3% (clamp 15% to 98%)
        const loadChange = Math.round(Math.random() * 6 - 3);
        let newLoad = trans.load_percent + loadChange;
        if (newLoad < 15) newLoad = 15;
        if (newLoad > 98) newLoad = 98;

        await db.run('UPDATE transport_options SET eta = ?, load_percent = ? WHERE id = ?', [newEta, newLoad, trans.id]);
      }

      // 3. Increment Sustainability Metrics
      const metrics = await db.all('SELECT * FROM sustainability_metrics');
      for (const metric of metrics) {
        let addition = 0;
        if (metric.metric_type === 'water') {
          addition = Math.random() * 15 + 5; // 5-20 gallons
        } else if (metric.metric_type === 'energy') {
          addition = Math.random() * 30 + 10; // 10-40 kWh
        } else if (metric.metric_type === 'waste') {
          addition = Math.random() * 8 + 2; // 2-10 lbs
        }
        const newValue = metric.value + addition;

        await db.run('UPDATE sustainability_metrics SET value = ? WHERE id = ?', [newValue, metric.id]);
      }

      // 4. Fetch Fresh Data & Broadcast via WebSockets
      const updatedZones = await db.all('SELECT * FROM zones');
      const updatedTransports = await db.all('SELECT * FROM transport_options');
      const updatedMetrics = await db.all('SELECT * FROM sustainability_metrics');

      io.emit('zone_update', updatedZones);
      io.emit('transport_update', updatedTransports);
      io.emit('sustainability_update', updatedMetrics);

    } catch (err) {
      console.error('Simulator error during update tick:', err.message);
    }
  }, 3000);
}

function stopSimulator() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('StadiumIQ sensor simulator stopped.');
  }
}

module.exports = {
  startSimulator,
  stopSimulator
};
