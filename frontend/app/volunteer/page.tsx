/* eslint-disable */
"use client";

import { useEffect, useState } from "react";
import io from "socket.io-client";
import { 
  Users, ShieldAlert, AlertTriangle, FileSpreadsheet, 
  MapPin, CheckCircle, Clock, Check, Languages, Send, Loader2 
} from "lucide-react";

export default function VolunteerPortal() {
  // Real-time states
  const [incidents, setIncidents] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);

  // Reporter details
  const [volunteerName, setVolunteerName] = useState("Elena Rostova");
  const [assignedZone, setAssignedZone] = useState("zone-gate-c");

  // New Incident Form
  const [category, setCategory] = useState<"medical" | "crowd" | "lost_item" | "technical">("technical");
  const [zoneId, setZoneId] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Translation Tool States
  const [translateInput, setTranslateInput] = useState("");
  const [targetLang, setTargetLang] = useState("Spanish");
  const [translateResult, setTranslateResult] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    const socket = io("http://localhost:3001");

    socket.on("initial_state", (data) => {
      setIncidents(data.incidents);
      setZones(data.zones);
      if (data.zones.length > 0) {
        setZoneId(data.zones[0].id);
      }
    });

    socket.on("incident_update", (updatedIncidents) => {
      setIncidents(updatedIncidents);
    });

    socket.on("zone_update", (updatedZones) => {
      setZones(updatedZones);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Post Incident
  const handleSubmitIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("http://localhost:3001/api/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reporter_id: volunteerName,
          zone_id: zoneId,
          category,
          description
        }),
      });

      if (res.ok) {
        setDescription("");
        // Socket broadcast automatically refreshes local list
      }
    } catch (err) {
      console.error("Failed to report incident", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Patch Status
  const handleUpdateStatus = async (id: string, newStatus: "in_progress" | "resolved") => {
    try {
      await fetch(`http://localhost:3001/api/incidents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  // Submit Translation
  const handleTranslate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!translateInput.trim()) return;

    setIsTranslating(true);
    try {
      const res = await fetch("http://localhost:3001/api/ai/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: translateInput, targetLanguage: targetLang }),
      });

      const data = await res.json();
      setTranslateResult(data.response);
    } catch (err) {
      setTranslateResult("Translation failed. Please try again.");
    } finally {
      setIsTranslating(false);
    }
  };

  // Get zone name by ID helper
  const getZoneName = (id: string) => {
    const zone = zones.find((z) => z.id === id);
    return zone ? zone.name : id;
  };

  // Urgency badge helper
  const getUrgencyBadge = (score: number) => {
    if (score >= 7) return "bg-red-100 text-[#E63946] border-red-200";
    if (score >= 4) return "bg-amber-100 text-amber-600 border-amber-200";
    return "bg-green-100 text-[#00A651] border-green-200";
  };

  // Kanban column grouping
  const getIncidentsByStatus = (status: "new" | "in_progress" | "resolved") => {
    return incidents.filter((inc) => inc.status === status);
  };

  return (
    <div className="min-h-screen bg-[#F7F9FB] flex flex-col">
      {/* Header */}
      <header className="bg-[#0F2C4C] text-white py-4 px-6 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#FFC107] text-[#0F2C4C] rounded-lg">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">StadiumIQ <span className="text-[#FFC107]">Staff Dashboard</span></h1>
            <p className="text-[10px] text-slate-300 font-light font-mono">Duty Personnel Node</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Duty profile selector */}
          <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/20">
            <span className="h-2 w-2 bg-[#00A651] rounded-full" />
            <select 
              value={volunteerName} 
              onChange={(e) => {
                setVolunteerName(e.target.value);
                setAssignedZone(e.target.value === "Elena Rostova" ? "zone-gate-c" : "zone-concourse-l1");
              }}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
            >
              <option className="text-slate-800" value="Elena Rostova">Elena Rostova</option>
              <option className="text-slate-800" value="Carlos Ramos">Carlos Ramos</option>
            </select>
          </div>
          <a href="/" className="text-xs text-slate-300 hover:text-white transition-colors">
            Exit Dashboard
          </a>
        </div>
      </header>

      {/* Main Board Container */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Hand: Shift Roster, Report Incident & Translation Tools (4 cols) */}
        <section className="lg:col-span-4 space-y-6">
          
          {/* Duty Info Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-[#0F2C4C] text-sm mb-3">Shift & Zone Assignment</h3>
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-light">Duty Zone:</span>
                <span className="font-bold text-[#0F2C4C] flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-amber-500" /> {getZoneName(assignedZone)}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-light">Assigned Status:</span>
                <span className="font-bold text-[#00A651]">Active Duty</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-light">Shift Window:</span>
                <span className="font-medium text-slate-600 font-mono">08:00 - 16:00 UTC</span>
              </div>
            </div>
          </div>

          {/* Incident Reporter Form */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-md text-[#0F2C4C] flex items-center gap-2 mb-4">
              <ShieldAlert className="h-5 w-5 text-[#E63946]" /> Report Incident
            </h3>
            
            <form onSubmit={handleSubmitIncident} className="space-y-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-[#0F2C4C] uppercase tracking-wider mb-1.5">Category</label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-[#0F2C4C] focus:outline-none font-medium"
                >
                  <option value="technical">Technical / Structural</option>
                  <option value="medical">Medical / Injury</option>
                  <option value="crowd">Crowd Flow / Bottleneck</option>
                  <option value="lost_item">Lost & Found Item</option>
                </select>
              </div>

              {/* Zone / Location */}
              <div>
                <label className="block text-xs font-bold text-[#0F2C4C] uppercase tracking-wider mb-1.5">Zone Location</label>
                <select 
                  value={zoneId} 
                  onChange={(e) => setZoneId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-[#0F2C4C] focus:outline-none"
                >
                  {zones.map((z) => (
                    <option key={z.id} value={z.id}>{z.name}</option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-[#0F2C4C] uppercase tracking-wider mb-1.5">Description (AI urgency scored)</label>
                <textarea 
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="State the problem clearly... e.g. Severe water spill near turnstiles."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-[#0F2C4C] focus:outline-none leading-relaxed"
                />
              </div>

              {/* Submit */}
              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-[#E63946] hover:bg-[#E63946]/95 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
                Submit Incident Report
              </button>
            </form>
          </div>

          {/* Multilingual Translator Tool */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-md text-[#0F2C4C] flex items-center gap-2 mb-4">
              <Languages className="h-5 w-5 text-[#FFC107]" /> Fan Translation Assist
            </h3>
            
            <form onSubmit={handleTranslate} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#0F2C4C] uppercase tracking-wider mb-1.5">Translate to</label>
                <select 
                  value={targetLang} 
                  onChange={(e) => setTargetLang(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-[#0F2C4C] focus:outline-none"
                >
                  <option value="Spanish">Spanish (Español)</option>
                  <option value="French">French (Français)</option>
                  <option value="Portuguese">Portuguese (Português)</option>
                  <option value="Arabic">Arabic (العربية)</option>
                  <option value="Hindi">Hindi (हिन्दी)</option>
                </select>
              </div>

              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={translateInput}
                  onChange={(e) => setTranslateInput(e.target.value)}
                  placeholder="Ask standard fan questions..."
                  className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#0F2C4C]"
                />
                <button 
                  type="submit"
                  disabled={isTranslating}
                  className="bg-[#0F2C4C] hover:bg-[#0F2C4C]/95 text-white px-3.5 py-2 rounded-xl text-xs flex items-center justify-center shrink-0 disabled:opacity-50"
                >
                  {isTranslating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </form>

            {translateResult && (
              <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-xl animate-slide-up">
                <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1">AI Output</div>
                <p className="text-xs text-slate-700 font-medium leading-relaxed italic">{translateResult}</p>
              </div>
            )}
          </div>

        </section>

        {/* Right Hand: Kanban Incident task board (8 cols) */}
        <section className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-[#0F2C4C] flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-indigo-500" /> Incident Operations Board
            </h3>
            <span className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-bold">
              {incidents.filter((i) => i.status !== "resolved").length} active cases
            </span>
          </div>

          {/* Kanban Columns */}
          <div className="grid md:grid-cols-3 gap-6 flex-1 items-start">
            
            {/* COLUMN 1: NEW INCIDENTS */}
            <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 flex flex-col h-[520px]">
              <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2 shrink-0">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#E63946]" /> New Alerts
                </span>
                <span className="text-[10px] font-bold bg-[#E63946]/10 text-[#E63946] px-2 py-0.5 rounded-full">
                  {getIncidentsByStatus("new").length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {getIncidentsByStatus("new").map((inc) => (
                  <div key={inc.id} className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm animate-slide-up space-y-3 hover:border-slate-300 transition-colors">
                    <div className="flex justify-between items-start gap-1">
                      <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
                        {inc.category.replace('_', ' ')}
                      </span>
                      <span className={`text-[10px] border px-2 py-0.5 rounded-full font-bold ${getUrgencyBadge(inc.ai_urgency_score)}`}>
                        Score: {inc.ai_urgency_score}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-light">{inc.description}</p>

                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{getZoneName(inc.zone_id)}</span>
                    </div>

                    <button 
                      onClick={() => handleUpdateStatus(inc.id, "in_progress")}
                      className="w-full bg-[#0F2C4C] hover:bg-[#0F2C4C]/95 text-white py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1"
                    >
                      <Clock className="h-3.5 w-3.5" /> Start Resolution
                    </button>
                  </div>
                ))}
                {getIncidentsByStatus("new").length === 0 && (
                  <div className="h-full flex flex-col justify-center items-center text-slate-400 py-12 text-center text-xs font-light">
                    <CheckCircle className="h-8 w-8 text-slate-300 mb-2" />
                    No new alerts reported.
                  </div>
                )}
              </div>
            </div>

            {/* COLUMN 2: IN PROGRESS */}
            <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 flex flex-col h-[520px]">
              <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2 shrink-0">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500" /> Active Work
                </span>
                <span className="text-[10px] font-bold bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full">
                  {getIncidentsByStatus("in_progress").length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {getIncidentsByStatus("in_progress").map((inc) => (
                  <div key={inc.id} className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm animate-slide-up space-y-3 hover:border-slate-300 transition-colors">
                    <div className="flex justify-between items-start gap-1">
                      <span className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
                        {inc.category.replace('_', ' ')}
                      </span>
                      <span className={`text-[10px] border px-2 py-0.5 rounded-full font-bold ${getUrgencyBadge(inc.ai_urgency_score)}`}>
                        Score: {inc.ai_urgency_score}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed font-light">{inc.description}</p>

                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{getZoneName(inc.zone_id)}</span>
                    </div>

                    <button 
                      onClick={() => handleUpdateStatus(inc.id, "resolved")}
                      className="w-full bg-[#00A651] hover:bg-[#00A651]/95 text-white py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-1"
                    >
                      <Check className="h-3.5 w-3.5" /> Resolve Incident
                    </button>
                  </div>
                ))}
                {getIncidentsByStatus("in_progress").length === 0 && (
                  <div className="h-full flex flex-col justify-center items-center text-slate-400 py-12 text-center text-xs font-light">
                    <CheckCircle className="h-8 w-8 text-slate-300 mb-2" />
                    No active tasks currently.
                  </div>
                )}
              </div>
            </div>

            {/* COLUMN 3: RESOLVED */}
            <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 flex flex-col h-[520px]">
              <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2 shrink-0">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#00A651]" /> Resolved
                </span>
                <span className="text-[10px] font-bold bg-[#00A651]/10 text-[#00A651] px-2 py-0.5 rounded-full">
                  {getIncidentsByStatus("resolved").length}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {getIncidentsByStatus("resolved").map((inc) => (
                  <div key={inc.id} className="bg-white/70 border border-slate-200/50 rounded-xl p-4 shadow-sm animate-slide-up space-y-3 opacity-75">
                    <div className="flex justify-between items-start gap-1">
                      <span className="text-[10px] bg-slate-100 text-slate-500 border border-slate-200 px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
                        {inc.category.replace('_', ' ')}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed font-light line-through">{inc.description}</p>

                    <div className="flex items-center gap-1 text-[10px] text-slate-400">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{getZoneName(inc.zone_id)}</span>
                    </div>
                  </div>
                ))}
                {getIncidentsByStatus("resolved").length === 0 && (
                  <div className="h-full flex flex-col justify-center items-center text-slate-400 py-12 text-center text-xs font-light">
                    <Clock className="h-8 w-8 text-slate-300 mb-2" />
                    No resolved cases logged yet.
                  </div>
                )}
              </div>
            </div>

          </div>

        </section>

      </main>
    </div>
  );
}
