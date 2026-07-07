/**
 * StadiumIQ REST API Automated Test Script
 * Verifies all Express endpoints and AI routing capabilities.
 * Run this while the server is active on http://localhost:3001.
 */

const BACKEND_URL = 'http://localhost:3001';

async function testEndpoint(name, path, options = {}) {
  try {
    const url = `${BACKEND_URL}${path}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });

    if (res.ok) {
      console.log(`[PASS] ${name} (${res.status})`);
      const json = await res.json();
      return { ok: true, json };
    } else {
      const text = await res.text();
      console.error(`[FAIL] ${name} returned status ${res.status}: ${text}`);
      return { ok: false };
    }
  } catch (err) {
    console.error(`[ERROR] ${name} failed to connect:`, err.message);
    return { ok: false };
  }
}

async function runTests() {
  console.log('--------------------------------------------------');
  console.log('Running StadiumIQ Backend REST API Verification...');
  console.log('--------------------------------------------------\n');

  let failedCount = 0;

  // 1. Get Zones
  const zonesRes = await testEndpoint('GET Zones Feed', '/api/zones');
  if (!zonesRes.ok || !Array.isArray(zonesRes.json) || zonesRes.json.length === 0) {
    failedCount++;
  }

  // 2. Get Transport Options
  const transportRes = await testEndpoint('GET Transport Options Feed', '/api/transport');
  if (!transportRes.ok) {
    failedCount++;
  }

  // 3. Post New Incident
  const incidentPayload = {
    reporter_id: 'Test Runner',
    zone_id: 'zone-gate-b',
    category: 'medical',
    description: 'A spectator fell down the stairs near Gate B and is complaining of ankle pain.'
  };
  const postIncRes = await testEndpoint('POST Create Incident', '/api/incidents', {
    method: 'POST',
    body: JSON.stringify(incidentPayload)
  });
  if (!postIncRes.ok || postIncRes.json.ai_urgency_score !== 9) {
    console.error(`[WARN] Urgent scoring was expected to be 9, got: ${postIncRes.json?.ai_urgency_score}`);
    failedCount++;
  }

  // 4. Update Incident Status
  if (postIncRes.ok && postIncRes.json.id) {
    const patchRes = await testEndpoint('PATCH Update Incident Status', `/api/incidents/${postIncRes.json.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'in_progress' })
    });
    if (!patchRes.ok || patchRes.json.status !== 'in_progress') {
      failedCount++;
    }
  }

  // 5. Post Alert
  const alertPayload = {
    message: 'Test Broadcast message',
    target_role: 'volunteer',
    language: 'English'
  };
  const postAlertRes = await testEndpoint('POST Create Broadcast Alert', '/api/alerts', {
    method: 'POST',
    body: JSON.stringify(alertPayload)
  });
  if (!postAlertRes.ok) {
    failedCount++;
  }

  // 6. AI Wayfinding Advice
  const wayfindingRes = await testEndpoint('POST AI Wayfinding', '/api/ai/navigate', {
    method: 'POST',
    body: JSON.stringify({ message: 'Where is the nearest restroom?', language: 'English' })
  });
  if (!wayfindingRes.ok) {
    failedCount++;
  }

  // 7. AI Translation
  const translateRes = await testEndpoint('POST AI Translation', '/api/ai/translate', {
    method: 'POST',
    body: JSON.stringify({ text: 'Please go to Gate A immediately.', targetLanguage: 'Spanish' })
  });
  if (!translateRes.ok) {
    failedCount++;
  }

  // 8. AI Emergency Decision
  const decisionRes = await testEndpoint('POST AI Emergency Decision Plan', '/api/ai/decision', {
    method: 'POST',
    body: JSON.stringify({ scenario: 'Heavy rain flooding Gate B South entrance.' })
  });
  if (!decisionRes.ok) {
    failedCount++;
  }

  // 9. AI Admin Briefing
  const briefingRes = await testEndpoint('GET AI Operational Executive Briefing', '/api/ai/briefing');
  if (!briefingRes.ok) {
    failedCount++;
  }

  console.log('\n--------------------------------------------------');
  if (failedCount === 0) {
    console.log('STATUS: [SUCCESS] All StadiumIQ backend API routes are verified!');
  } else {
    console.error(`STATUS: [FAILURE] ${failedCount} API tests failed.`);
  }
  console.log('--------------------------------------------------');
}

runTests();
