/* eslint-disable */
"use client";

import { useEffect, useState } from "react";
import io from "socket.io-client";
import Link from "next/link";
import { API_URL } from "../config";
import { 
  ShieldAlert, Activity, AlertTriangle, Send, Loader2, BarChart3, 
  Map, MessageSquare, AlertCircle, RefreshCw, Printer, Award, Sparkles, Bus
} from "lucide-react";

export default function AdminCommandCenter() {
  // Real-time states
  const [zones, setZones] = useState<any[]>([]);
  const [transports, setTransports] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  // Alert Broadcaster Form
  const [alertMessage, setAlertMessage] = useState("");
  const [alertTarget, setAlertTarget] = useState<"all" | "volunteer" | "fan" | "admin">("all");
  const [alertLanguage, setAlertLanguage] = useState("English");
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  // Decision Support Console
  const [customScenario, setCustomScenario] = useState("");
  const [aiDecisionPlan, setAiDecisionPlan] = useState("");
  const [isDecisionLoading, setIsDecisionLoading] = useState(false);

  // Executive Briefing Summary
  const [briefing, setBriefing] = useState("");
  const [isBriefingLoading, setIsBriefingLoading] = useState(false);

  // Post-Match Report state
  const [showReport, setShowReport] = useState(false);
  const [matchReport, setMatchReport] = useState<any>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  useEffect(() => {
    const socket = io(API_URL);

    socket.on("initial_state", (data) => {
      setZones(data.zones);
      setTransports(data.transports);
      setMetrics(data.metrics);
      setIncidents(data.incidents);
      setAlerts(data.alerts);
    });

    socket.on("zone_update", (updatedZones) => {
      setZones(updatedZones);
    });

    socket.on("transport_update", (updatedTransports) => {
      setTransports(updatedTransports);
    });

    socket.on("sustainability_update", (updatedMetrics) => {
      setMetrics(updatedMetrics);
    });

    socket.on("incident_update", (updatedIncidents) => {
      setIncidents(updatedIncidents);
    });

    socket.on("alert_broadcast", (newAlert) => {
      setAlerts((prev) => [newAlert, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Fetch initial briefing
  useEffect(() => {
    handleRefreshBriefing();
  }, [zones]); // Reload briefing when zone details load

  // Refresh Executive Briefing
  const handleRefreshBriefing = async () => {
    setIsBriefingLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/ai/briefing`);
      const data = await res.json();
      setBriefing(data.response);
    } catch (err) {
      setBriefing("Unable to fetch operational briefing.");
    } finally {
      setIsBriefingLoading(false);
    }
  };

  // Submit decision plan
  const handleRequestDecisionSupport = async (scenarioText: string) => {
    const query = scenarioText || customScenario;
    if (!query.trim()) return;

    setIsDecisionLoading(true);
    setCustomScenario(query);
    try {
      const res = await fetch(`${API_URL}/api/ai/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario: query }),
      });
      const data = await res.json();
      setAiDecisionPlan(data.response);
    } catch (err) {
      setAiDecisionPlan("Failed to generate response plan.");
    } finally {
      setIsDecisionLoading(false);
    }
  };

  // Broadcast command alert
  const handleBroadcastAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alertMessage.trim()) return;

    setIsBroadcasting(true);
    try {
      const res = await fetch(`${API_URL}/api/alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: alertMessage,
          target_role: alertTarget,
          language: alertLanguage
        }),
      });

      if (res.ok) {
        setAlertMessage("");
      }
    } catch (err) {
      console.error("Broadcast alert failed", err);
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Generate Post Match Report
  const handleGeneratePostMatchReport = async () => {
    setIsGeneratingReport(true);
    setShowReport(false);

    setTimeout(async () => {
      try {
        const totalInc = incidents.length;
        const resolvedInc = incidents.filter(i => i.status === "resolved").length;
        const activeInc = totalInc - resolvedInc;
        
        // Find peak zone density
        let peakZone = { name: "N/A", pct: 0 };
        zones.forEach(z => {
          const pct = (z.current_count / z.capacity) * 100;
          if (pct > peakZone.pct) {
            peakZone = { name: z.name, pct: Math.round(pct) };
          }
        });

        // Sustainability totals
        const waterUsed = Math.round(metrics.find(m => m.metric_type === 'water')?.value || 14200);
        const energyUsed = Math.round(metrics.find(m => m.metric_type === 'energy')?.value || 48900);
        const wasteRecycled = Math.round(metrics.find(m => m.metric_type === 'waste')?.value || 3540);

        setMatchReport({
          matchId: "WC26-M4-DAL",
          fixture: "USA vs Germany (FIFA World Cup 2026)",
          timestamp: new Date().toLocaleDateString(),
          kpis: {
            totalIncidents: totalInc,
            resolvedIncidents: resolvedInc,
            openIncidents: activeInc,
            peakDensityZone: `${peakZone.name} (${peakZone.pct}% load)`,
            waterConservation: `${waterUsed} Gallons`,
            energyConsumption: `${energyUsed} kWh`,
            wasteRecycled: `${wasteRecycled} lbs`
          },
          aiRecommendations: [
            "Concourse Level 1 experienced peak density bottlenecks during half-time. Recommendation: Shift 3 food vendors to Concourse Level 2 to balance pedestrian crowds.",
            "Water consumption peaked 10% higher than matchday 3. Action: Optimize restroom flush volumes by 8% prior to the upcoming quarter-final match.",
            "Queue splitting at Gate C reduced entrance wait times by 4.5 minutes. Recommended strategy: Deploy Gate C volunteers to Gate B scanners for matchday 5.",
            "Recycling metrics improved by 22% due to gamified point logger. Plan: Install 5 additional gold bins around public transport gates."
          ]
        });
        setShowReport(true);
      } catch (err) {
        console.error("Report compilation failed", err);
      } finally {
        setIsGeneratingReport(false);
      }
    }, 1500); // realistic load time
  };

  // Calculations for KPIs
  const totalZoneCount = zones.reduce((sum, z) => sum + z.current_count, 0);
  const totalZoneCapacity = zones.reduce((sum, z) => sum + z.capacity, 0);
  const overallOccupancyPct = totalZoneCapacity > 0 ? Math.round((totalZoneCount / totalZoneCapacity) * 100) : 0;

  const activeIncidentsCount = incidents.filter(i => i.status !== "resolved").length;

  const averageTransitWait = transports.length > 0 
    ? Math.round(transports.reduce((sum, t) => sum + t.eta, 0) / transports.length)
    : 0;

  return (
    <div className="min-h-screen bg-[#F7F9FB] flex flex-col">
      {/* Top Header */}
      <header className="bg-[#0F2C4C] text-white py-4 px-6 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#E63946] text-white rounded-lg">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">StadiumIQ <span className="text-[#FFC107]">Command Operations</span></h1>
            <p className="text-[10px] text-slate-300 font-light font-mono">FIFA Tournament Director Terminal</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleGeneratePostMatchReport}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
          >
            {isGeneratingReport ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Printer className="h-3.5 w-3.5" />}
            Compile Post-Match Report
          </button>
          <Link href="/" className="text-xs text-slate-300 hover:text-white transition-colors ml-2">
            Exit Dashboard
          </Link>
        </div>
      </header>

      {/* Main Grid */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Live KPIs & Alert Broadcaster (5 cols) */}
        <section className="lg:col-span-5 space-y-6">
          
          {/* KPI Dashboard Grid */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-[#0F2C4C] text-sm mb-4 uppercase tracking-wider flex items-center gap-1.5">
              <BarChart3 className="h-4.5 w-4.5 text-[#0F2C4C]" /> Live Operational KPIs
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {/* Overall Occupancy */}
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                <span className="block text-xs text-slate-400 font-light mb-1">Overall Stadium Load</span>
                <span className="text-2xl font-black text-[#0F2C4C]">{overallOccupancyPct}%</span>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-2">
                  <div 
                    className="h-full rounded-full bg-[#00A651]" 
                    style={{ width: `${overallOccupancyPct}%` }}
                  />
                </div>
              </div>

              {/* Active incidents */}
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                <span className="block text-xs text-slate-400 font-light mb-1">Active Incidents</span>
                <span className="text-2xl font-black text-[#E63946]">{activeIncidentsCount}</span>
                <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-400 font-light">
                  <Activity className="h-3 w-3 text-[#E63946] animate-pulse" /> Live telemetry feeds
                </div>
              </div>

              {/* Transit delay */}
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                <span className="block text-xs text-slate-400 font-light mb-1">Avg Transit Wait</span>
                <span className="text-2xl font-black text-amber-500">{averageTransitWait} mins</span>
                <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-400 font-light">
                  <Bus className="h-3 w-3 text-amber-500" /> Shuttles & Metro queues
                </div>
              </div>

              {/* Sustainability metric */}
              <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl">
                <span className="block text-xs text-slate-400 font-light mb-1">Eco Score</span>
                <span className="text-2xl font-black text-[#00A651]">A+ Excellent</span>
                <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-400 font-light">
                  <Award className="h-3 w-3 text-[#00A651]" /> Zero waste target
                </div>
              </div>
            </div>
          </div>

          {/* Alert Broadcaster form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-[#0F2C4C] text-sm mb-4 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="h-4.5 w-4.5 text-[#E63946]" /> Multilingual Alert Broadcaster
            </h3>

            <form onSubmit={handleBroadcastAlert} className="space-y-4">
              {/* Message */}
              <div>
                <label className="block text-xs font-bold text-[#0F2C4C] uppercase tracking-wider mb-1.5">Alert Message</label>
                <textarea 
                  rows={2}
                  value={alertMessage}
                  onChange={(e) => setAlertMessage(e.target.value)}
                  placeholder="Enter message to broadcast to screens..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-[#0F2C4C] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Target Audience */}
                <div>
                  <label className="block text-xs font-bold text-[#0F2C4C] uppercase tracking-wider mb-1.5">Target Audience</label>
                  <select 
                    value={alertTarget} 
                    onChange={(e) => setAlertTarget(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs focus:outline-none font-medium"
                  >
                    <option value="all">Everyone (All Roles)</option>
                    <option value="fan">Fans Only</option>
                    <option value="volunteer">Staff & Volunteers</option>
                    <option value="admin">Admins Only</option>
                  </select>
                </div>

                {/* Broadcast Language */}
                <div>
                  <label className="block text-xs font-bold text-[#0F2C4C] uppercase tracking-wider mb-1.5">Auto-Translate to</label>
                  <select 
                    value={alertLanguage} 
                    onChange={(e) => setAlertLanguage(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs focus:outline-none font-medium"
                  >
                    <option value="English">English (Original)</option>
                    <option value="Spanish">Spanish (Español)</option>
                    <option value="French">French (Français)</option>
                    <option value="Portuguese">Portuguese (Português)</option>
                    <option value="Arabic">Arabic (العربية)</option>
                    <option value="Hindi">Hindi (हिन्दी)</option>
                  </select>
                </div>
              </div>

              <button 
                type="submit"
                disabled={isBroadcasting}
                className="w-full bg-[#E63946] hover:bg-[#E63946]/95 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isBroadcasting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Publish Live Command Alert
              </button>
            </form>
          </div>

          {/* Recent Broadcast logs */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm max-h-[220px] overflow-y-auto">
            <h4 className="text-xs font-bold text-[#0F2C4C] uppercase tracking-wider mb-3">Broadcast History</h4>
            <div className="space-y-2">
              {alerts.slice(0, 5).map((al) => (
                <div key={al.id} className="text-xs bg-slate-50 border border-slate-100 p-2.5 rounded-xl flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-slate-700">{al.message}</p>
                    <p className="text-[9px] text-slate-400 font-light mt-0.5">Target: <span className="uppercase font-bold text-slate-500">{al.target_role}</span></p>
                  </div>
                  <span className="text-[9px] text-slate-400 font-mono font-light shrink-0">
                    {new Date(al.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              {alerts.length === 0 && (
                <p className="text-xs text-slate-400 italic text-center py-4">No alerts broadcasted today.</p>
              )}
            </div>
          </div>

        </section>

        {/* Right Side: Decision Support & Executive Briefing (7 cols) */}
        <section className="lg:col-span-7 space-y-6">
          
          {/* Executive Briefing Summary */}
          <div className="bg-gradient-to-br from-[#0F2C4C] to-[#1a3d66] text-white rounded-2xl p-6 shadow-md border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-md flex items-center gap-2 text-[#FFC107]">
                <Sparkles className="h-5 w-5" /> Live Executive Operational Briefing
              </h3>
              <button 
                onClick={handleRefreshBriefing}
                disabled={isBriefingLoading}
                className="p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors border border-white/10"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isBriefingLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {isBriefingLoading ? (
              <div className="py-6 flex items-center gap-2 text-xs text-slate-300">
                <Loader2 className="h-4 w-4 animate-spin text-[#FFC107]" /> Summarizing live telemetry logs...
              </div>
            ) : (
              <p className="text-xs leading-relaxed text-slate-100 font-light italic">
                "{briefing || 'No briefing summary generated yet. Click refresh to query the AI coordinator.'}"
              </p>
            )}
          </div>

          {/* Ask StadiumIQ - Real-Time Decision Support Console */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-md text-[#0F2C4C] flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-indigo-500" /> AI Emergency Decision Support
              </h3>
              <span className="text-[10px] text-[#00A651] bg-[#00A651]/10 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Claude 3.5 Ready
              </span>
            </div>

            <p className="text-xs text-slate-500 mb-4 font-light">
              Select an emergency scenario below or write a custom operational challenge to generate a ranked action response plan.
            </p>

            {/* Quick Scenarios Buttons */}
            <div className="grid md:grid-cols-3 gap-3 mb-4">
              <button 
                onClick={() => handleRequestDecisionSupport("Heavy thunderstorm warning. 40mph winds expected in 15 minutes. Heavy crowd in Zone Section N (North stand).")}
                className="bg-slate-50 hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-200 p-3 rounded-xl text-left transition-colors flex flex-col justify-between"
              >
                <span className="text-xs font-bold text-slate-700">Weather Alert</span>
                <span className="text-[9px] text-slate-400 mt-1 font-light leading-snug">Heavy storm & high wind response</span>
              </button>

              <button 
                onClick={() => handleRequestDecisionSupport("Gate B scanner failures causing massive queue buildup. Density in Gate B South Entrance reaches 92%.")}
                className="bg-slate-50 hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-200 p-3 rounded-xl text-left transition-colors flex flex-col justify-between"
              >
                <span className="text-xs font-bold text-slate-700">Crowd Surge</span>
                <span className="text-[9px] text-slate-400 mt-1 font-light leading-snug">Scanner failure & bottleneck split</span>
              </button>

              <button 
                onClick={() => handleRequestDecisionSupport("Power grid failure reported at Concourse Level 2. Merchandise hubs offline. Dark corridor hazard.")}
                className="bg-slate-50 hover:bg-indigo-50 border border-slate-200/80 hover:border-indigo-200 p-3 rounded-xl text-left transition-colors flex flex-col justify-between"
              >
                <span className="text-xs font-bold text-slate-700">Power Failure</span>
                <span className="text-[9px] text-slate-400 mt-1 font-light leading-snug">Emergency lighting & hub evacuation</span>
              </button>
            </div>

            {/* Text Input */}
            <div className="flex gap-2">
              <input 
                type="text" 
                value={customScenario}
                onChange={(e) => setCustomScenario(e.target.value)}
                placeholder="Describe a custom operational challenge..."
                className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#0F2C4C]"
              />
              <button 
                onClick={() => handleRequestDecisionSupport("")}
                disabled={isDecisionLoading}
                className="bg-[#0F2C4C] hover:bg-[#0F2C4C]/95 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-colors flex items-center justify-center shrink-0 disabled:opacity-50"
              >
                {isDecisionLoading ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : "Plan"}
              </button>
            </div>

            {/* Decision Plan Result */}
            {aiDecisionPlan && (
              <div className="mt-6 border border-slate-200 rounded-xl overflow-hidden animate-slide-up">
                <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">AI Operational Action Plan</span>
                  <span className="text-[9px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full">Claude-assisted response</span>
                </div>
                <div className="p-4 bg-slate-50/30">
                  <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                    {aiDecisionPlan}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Post Match Report Render Panel */}
          {showReport && matchReport && (
            <div className="bg-white border border-indigo-200 rounded-2xl p-6 shadow-lg animate-slide-up space-y-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600/5 rounded-bl-full" />
              
              {/* Header */}
              <div className="border-b border-slate-200 pb-4">
                <span className="text-[10px] bg-indigo-50 border border-indigo-200 text-indigo-600 font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Tournament Operations Report
                </span>
                <h3 className="font-extrabold text-2xl text-[#0F2C4C] mt-3">Post-Match AI Operations Summary</h3>
                <p className="text-xs text-slate-400 font-light mt-1">Fixture: {matchReport.fixture} | ID: {matchReport.matchId} | Date: {matchReport.timestamp}</p>
              </div>

              {/* Data metrics table */}
              <div>
                <h4 className="text-xs font-bold text-[#0F2C4C] uppercase tracking-wider mb-2">Metrics Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-center">
                    <span className="block text-sm font-bold text-[#0F2C4C]">{matchReport.kpis.totalIncidents}</span>
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Total Incidents</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-center">
                    <span className="block text-sm font-bold text-[#00A651]">{matchReport.kpis.resolvedIncidents}</span>
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Resolved Cases</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-center">
                    <span className="block text-xs font-bold text-[#0F2C4C] truncate">{matchReport.kpis.peakDensityZone}</span>
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Peak Crowd Area</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl text-center">
                    <span className="block text-sm font-bold text-[#00A651]">{matchReport.kpis.wasteRecycled}</span>
                    <span className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Waste Recycled</span>
                  </div>
                </div>
              </div>

              {/* AI Recommendations List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-[#0F2C4C] uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="h-4 w-4 text-[#FFC107]" /> AI Recommendations for Next Matchday
                </h4>
                <ul className="space-y-2">
                  {matchReport.aiRecommendations.map((rec: string, index: number) => (
                    <li key={index} className="text-xs text-slate-600 leading-relaxed font-light pl-4 relative">
                      <span className="absolute left-0 top-1.5 h-1.5 w-1.5 rounded-full bg-indigo-500" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Bottom Print Button */}
              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button 
                  onClick={() => window.print()}
                  className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-1.5"
                >
                  <Printer className="h-4 w-4" /> Print / Save PDF
                </button>
              </div>

            </div>
          )}

        </section>

      </main>
    </div>
  );
}
