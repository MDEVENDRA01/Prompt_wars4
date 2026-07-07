const { Anthropic } = require('@anthropic-ai/sdk');
const db = require('./database');
require('dotenv').config();

// Initialize Anthropic client if key is available
let anthropic = null;
if (process.env.ANTHROPIC_API_KEY && process.env.ANTHROPIC_API_KEY !== 'YOUR_ANTHROPIC_API_KEY') {
  try {
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    console.log('Anthropic Claude API client initialized successfully.');
  } catch (err) {
    console.warn('Failed to initialize Anthropic client, using smart fallback AI. Error:', err.message);
  }
} else {
  console.log('No ANTHROPIC_API_KEY detected. Using intelligent rule-based AI engine for offline demo mode.');
}

/**
 * Standard Claude API caller helper
 */
async function callClaude(systemPrompt, userPrompt) {
  if (!anthropic) {
    throw new Error('Claude client not initialized');
  }
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });
  return response.content[0].text;
}

/**
 * Intelligent Rule-Based Mock AI engine
 */
function ruleBasedMockAI(type, inputs) {
  console.log(`Fallback AI triggering for type: ${type}`);
  const msg = (inputs.message || '').toLowerCase();
  const lang = (inputs.language || 'English').toLowerCase();

  const translations = {
    spanish: {
      nav: 'Para llegar a la Puerta A, siga las señales verdes a través del pasillo 1.',
      restroom: 'Los baños accesibles más cercanos están en el nivel 1 de la explanada.',
      gate_b: 'La puerta B está en el lado sur. Capacidad actual aproximada de carga: moderada.',
      welcome: '¡Bienvenido a StadiumIQ! ¿Cómo puedo ayudarle hoy?',
      help: 'Por favor, reporte cualquier emergencia al personal de inmediato.'
    },
    french: {
      nav: 'Pour accéder à la Porte A, veuillez suivre les panneaux verts par le hall 1.',
      restroom: 'Les toilettes accessibles les plus proches sont situées au niveau 1.',
      gate_b: 'La porte B se trouve du côté sud. Niveau de foule actuel : modéré.',
      welcome: 'Bienvenue sur StadiumIQ ! Comment puis-je vous aider aujourd’hui ?',
      help: 'Veuillez signaler immédiatement toute urgence au personnel.'
    },
    arabic: {
      nav: 'للذهاب إلى البوابة A، يرجى اتباع اللافتات الخضراء عبر الممر 1.',
      restroom: 'أقرب دورات مياه تقع في الطابق الأول من البهو الرئيسي.',
      gate_b: 'البوابة B تقع في الجانب الجنوبي. كثافة الحشود الحالية: متوسطة.',
      welcome: 'مرحبًا بك في StadiumIQ! كيف يمكنني مساعدتك اليوم؟',
      help: 'يرجى إبلاغ الموظفين بأي طوارئ فوراً.'
    },
    portuguese: {
      nav: 'Para chegar ao Portão A, siga as placas verdes pelo Corredor 1.',
      restroom: 'Os banheiros acessíveis mais próximos ficam no Nível 1 do saguão.',
      gate_b: 'O Portão B está localizado no lado sul. Lotação atual: moderada.',
      welcome: 'Bem-vindo ao StadiumIQ! Como posso ajudar você hoje?',
      help: 'Por favor, relate qualquer emergência à equipe imediatamente.'
    },
    hindi: {
      nav: 'गेट A पर जाने के लिए, कृपया कॉरिडोर 1 से होते हुए हरे संकेतों का पालन करें।',
      restroom: 'निकटतम सुलभ शौचालय मुख्य कॉनकोर्स के स्तर 1 पर स्थित हैं।',
      gate_b: 'गेट B दक्षिण दिशा में स्थित है। वर्तमान भीड़ का स्तर: मध्यम है।',
      welcome: 'StadiumIQ में आपका स्वागत है! आज मैं आपकी क्या मदद कर सकता हूँ?',
      help: 'कृपया किसी भी आपातकालीन स्थिति की सूचना तुरंत कर्मचारियों को दें।'
    }
  };

  const currentTrans = translations[lang] || null;

  switch (type) {
    case 'navigate': {
      if (currentTrans) {
        if (msg.includes('restroom') || msg.includes('toilet') || msg.includes('baño') || msg.includes('toilette')) {
          return currentTrans.restroom;
        }
        return currentTrans.nav;
      }
      if (msg.includes('gate a')) {
        return 'Gate A (North Entrance) is located at the northern perimeter of the stadium. It is currently operating with normal wait times. Walk straight along the Outer Ring Road and follow the blue pillars.';
      }
      if (msg.includes('gate b')) {
        return 'Gate B (South Entrance) has high crowd density (approx. 67% capacity). If you are coming from Parking P1, we advise taking the Outer Promenade pathway towards Gate D to avoid queues.';
      }
      if (msg.includes('restroom') || msg.includes('toilet') || msg.includes('washroom')) {
        return 'The nearest restrooms are located directly behind Section N (North Stand) on Concourse Level 1, and adjacent to the food court near Section E. All restroom facilities are fully wheelchair accessible.';
      }
      if (msg.includes('metro') || msg.includes('train') || msg.includes('subway')) {
        return 'The Metro Link Station is situated on the East side of the stadium complex. Exit through Gate C and proceed down the pedestrian flyover. Trains depart every 4 minutes.';
      }
      return 'I am the StadiumIQ Wayfinding Assistant. You can ask me directions to Gate A-D, restroom facilities, concessions, or public transport links!';
    }

    case 'accessibility': {
      if (msg.includes('wheelchair') || msg.includes('step') || msg.includes('ramp')) {
        return 'Step-free route activated: For wheelchair access to Section E, exit the main lobby and use the North Concourse Elevators. All turnstiles at Gates A, B, and D have dedicated step-free wide lanes. Gate C has a ramp access on the right-hand side.';
      }
      if (msg.includes('quiet') || msg.includes('sensory') || msg.includes('noise')) {
        return 'A sensory-quiet room is located near VIP Gate D on Concourse Level 2. Noise-cancelling headphones can be borrowed free of charge from the Guest Relations booth in the Level 1 Main Food Court.';
      }
      return 'StadiumIQ Accessibility Assistant active. Ask me about step-free routes, elevator locations, wheelchair seating sections, or sensory-quiet zones inside the stadium.';
    }

    case 'crowd-flow': {
      const zonesList = inputs.zones || [];
      const criticalZones = zonesList.filter(z => (z.current_count / z.capacity) >= 0.7);
      if (criticalZones.length === 0) {
        return 'All gates and concourses are flowing smoothly at normal densities (< 70% load). No actions required.';
      }
      const names = criticalZones.map(z => `${z.name} (${Math.round((z.current_count/z.capacity)*100)}% load)`).join(', ');
      return `Crowd alert: Congestion detected in: ${names}. RECOMMENDATION: Divert incoming ticket holders from Gates B/C towards VIP Gate D and Section W entry gates. Broadcast push notification to volunteers to start queue splitting.`;
    }

    case 'transport': {
      const options = inputs.transportOptions || [];
      const highLoad = options.filter(o => o.load_percent >= 80);
      let advice = 'All shuttle buses, metros, and parking lots are operating within normal limits. ';
      if (highLoad.length > 0) {
        advice = `Note: ${highLoad.map(o => o.name).join(', ')} are currently experiencing high load (>80%). `;
      }
      return `${advice}RECOMMENDED ACTION: Recommend fans to use the East Lot P2 (currently 30% load) or the Metro Stadium Line which has a transit headway of just 4 minutes. Suggested departure: 15 minutes before final whistle or 20 minutes after to avoid peak surge.`;
    }

    case 'sustainability': {
      const metrics = inputs.metrics || [];
      const water = metrics.find(m => m.metric_type === 'water')?.value || 14200;
      const energy = metrics.find(m => m.metric_type === 'energy')?.value || 48900;
      const waste = metrics.find(m => m.metric_type === 'waste')?.value || 3540;
      return `Sustainability Update: Today we have recycled ${waste} lbs of waste, utilized ${water} gallons of water, and consumed ${energy} kWh of energy. Eco-Tip: Place your empty beverage cups into the gold-labeled bin at Concourse B to score 50 Fan Points! Admin recommendation: Dim lights in auxiliary walkways by 15% to conserve energy during daylight hours.`;
    }

    case 'translate': {
      const text = inputs.text || '';
      const target = (inputs.targetLanguage || 'Spanish').toLowerCase();
      // Basic simulation translation helper
      if (target.includes('span')) {
        return `[Translated to Spanish]: ${text.replace('Gate A', 'Puerta A').replace('Incident', 'Incidente').replace('Medical', 'Médico')}`;
      }
      if (target.includes('fren')) {
        return `[Translated to French]: ${text.replace('Gate A', 'Porte A').replace('Incident', 'Incident').replace('Medical', 'Médical')}`;
      }
      return `[Translated to ${inputs.targetLanguage}]: ${text}`;
    }

    case 'briefing': {
      const incidents = inputs.incidents || [];
      const activeIncidents = incidents.filter(i => i.status !== 'resolved');
      const urgentCount = activeIncidents.filter(i => i.ai_urgency_score >= 7).length;
      return `Matchday Operational Briefing: There are currently ${activeIncidents.length} active incidents inside the stadium, including ${urgentCount} urgent cases. Main crowd flow is concentrated around Section S Seating (92% capacity). Transport links are running smoothly, with a slight delay reported in Shuttle Loop (ETA 12m).`;
    }

    case 'decision': {
      const scenario = (inputs.scenario || '').toLowerCase();
      if (scenario.includes('weather') || scenario.includes('rain') || scenario.includes('storm')) {
        return `WEATHER RESPONSE ACTION PLAN:
1. [RANK 1] Broadcast Alert: 'Heavy rain starting. Rest of match will continue, please secure rain-gear or seek concourse shelter.'
2. [RANK 2] Deploy wet-floor safety signage in all concourses (Responsibility: Maintenance Staff).
3. [RANK 3] Open supplementary indoor concourse seating areas (Responsibility: Gate Operations).
4. [RANK 4] Increase shuttle frequency for direct parking lot transit (Responsibility: Transport Coordinator).`;
      }
      if (scenario.includes('surge') || scenario.includes('overcrowd') || scenario.includes('crowd')) {
        return `CROWD SURGE RESPONSE ACTION PLAN:
1. [RANK 1] Deploy emergency crowd barrier gates at Section S entryways.
2. [RANK 2] Broadcast Alert to Staff: 'Zone Section S is nearing capacity. Staff redirect fans to Section W and Section E entries.'
3. [RANK 3] Reassign 4 floor volunteers from Concourse Level 2 to Gates B/C for line-management.
4. [RANK 4] Slow down ticket scanners by 5% to space out incoming visitor waves.`;
      }
      return `DECISION RECOMMENDATION:
1. Monitor density indicators at target zones.
2. Alert nearest floor staff via WebSocket.
3. Keep emergency exit paths clear.
4. Broadcast standard notification if density surpasses 90%.`;
    }

    default:
      return 'StadiumIQ AI Engine operational.';
  }
}

/**
 * Endpoints implementations
 */
async function getWayfindingAdvice(message, language) {
  if (anthropic) {
    try {
      const zones = await db.all('SELECT * FROM zones');
      const systemPrompt = `You are the StadiumIQ Navigation Wayfinding Assistant for the FIFA World Cup 2026. 
You must guide fans using natural, friendly and direct instructions in the requested language: ${language}.
Here is the JSON of stadium zones and locations:
${JSON.stringify(zones)}
Keep instructions brief, direct, and specify paths step-by-step. Make reference to gate capacities or names where helpful.`;
      return await callClaude(systemPrompt, message);
    } catch (e) {
      console.error('Claude wayfinding error, falling back:', e);
    }
  }
  return ruleBasedMockAI('navigate', { message, language });
}

async function getAccessibilityAdvice(message, language) {
  if (anthropic) {
    try {
      const zones = await db.all("SELECT * FROM zones WHERE accessibility_flags IS NOT NULL AND accessibility_flags != '[]'");
      const systemPrompt = `You are the StadiumIQ Accessibility Coordinator.
Provide clear step-free, wheelchair-friendly, or sensory-friendly routes to fans in ${language}.
Here is the JSON of accessible zones:
${JSON.stringify(zones)}
Give precise, caring, and clear instructions.`;
      return await callClaude(systemPrompt, message);
    } catch (e) {
      console.error('Claude accessibility error, falling back:', e);
    }
  }
  return ruleBasedMockAI('accessibility', { message, language });
}

async function getCrowdFlowAdvice() {
  const zones = await db.all('SELECT * FROM zones');
  if (anthropic) {
    try {
      const systemPrompt = `You are the Operational Crowd Control Engine. Analyze current counts against capacities and suggest redirecting routes.`;
      const userPrompt = `Current stadium occupancy statistics: ${JSON.stringify(zones)}. Summarize and provide immediate action steps.`;
      return await callClaude(systemPrompt, userPrompt);
    } catch (e) {
      console.error('Claude crowd flow error, falling back:', e);
    }
  }
  return ruleBasedMockAI('crowd-flow', { zones });
}

async function getTransportAdvice() {
  const transportOptions = await db.all('SELECT * FROM transport_options');
  if (anthropic) {
    try {
      const systemPrompt = `You are the Traffic & Public Transport Optimization Assistant. Recommend the best departure modes and times.`;
      const userPrompt = `Transit stats: ${JSON.stringify(transportOptions)}. Recommend route choice.`;
      return await callClaude(systemPrompt, userPrompt);
    } catch (e) {
      console.error('Claude transport error, falling back:', e);
    }
  }
  return ruleBasedMockAI('transport', { transportOptions });
}

async function getSustainabilityAdvice() {
  const metrics = await db.all('SELECT * FROM sustainability_metrics ORDER BY timestamp DESC LIMIT 10');
  if (anthropic) {
    try {
      const systemPrompt = `You are the Stadium Green Operations Expert. Create utility efficiency insights and tips for fans.`;
      const userPrompt = `Raw stats: ${JSON.stringify(metrics)}. Provide sustainability highlights and fan-actions.`;
      return await callClaude(systemPrompt, userPrompt);
    } catch (e) {
      console.error('Claude sustainability error, falling back:', e);
    }
  }
  return ruleBasedMockAI('sustainability', { metrics });
}

async function translateText(text, targetLanguage) {
  if (anthropic) {
    try {
      const systemPrompt = `Translate the user text into ${targetLanguage} accurately. Maintain any proper nouns like "Gate A", "Section S", or specific numbers exactly as is.`;
      return await callClaude(systemPrompt, text);
    } catch (e) {
      console.error('Claude translation error, falling back:', e);
    }
  }
  return ruleBasedMockAI('translate', { text, targetLanguage });
}

async function getAdminBriefing() {
  const incidents = await db.all('SELECT * FROM incidents WHERE status != "resolved"');
  const zones = await db.all('SELECT * FROM zones');
  if (anthropic) {
    try {
      const systemPrompt = `You are the Lead Tournament Intelligence Officer. Summarize match incidents and crowd levels into a concise operational update (3 sentences max).`;
      const userPrompt = `Incidents: ${JSON.stringify(incidents)}. Zone capacities: ${JSON.stringify(zones)}. Generate briefing.`;
      return await callClaude(systemPrompt, userPrompt);
    } catch (e) {
      console.error('Claude briefing error, falling back:', e);
    }
  }
  return ruleBasedMockAI('briefing', { incidents, zones });
}

async function getDecisionSupport(scenario) {
  const incidents = await db.all('SELECT * FROM incidents WHERE status != "resolved"');
  const zones = await db.all('SELECT * FROM zones');
  if (anthropic) {
    try {
      const systemPrompt = `You are the Emergency Response Command Assistant. Formulate a ranked action plan for the operations team based on the described scenario. Include a broadcast message for fans.`;
      const userPrompt = `Scenario: ${scenario}. Current state: Incidents: ${JSON.stringify(incidents)}, Zones: ${JSON.stringify(zones)}`;
      return await callClaude(systemPrompt, userPrompt);
    } catch (e) {
      console.error('Claude decision support error, falling back:', e);
    }
  }
  return ruleBasedMockAI('decision', { scenario, incidents, zones });
}

module.exports = {
  getWayfindingAdvice,
  getAccessibilityAdvice,
  getCrowdFlowAdvice,
  getTransportAdvice,
  getSustainabilityAdvice,
  translateText,
  getAdminBriefing,
  getDecisionSupport
};
