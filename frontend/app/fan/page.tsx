/* eslint-disable */
"use client";

import { useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import Link from "next/link";
import { API_URL } from "../config";
import { 
  Compass, MapPin, Bus, Navigation, Globe, Trash2, Award, 
  Accessibility, MessageSquare, AlertTriangle, Send, Loader2 
} from "lucide-react";

export default function FanPortal() {
  // Real-time states
  const [zones, setZones] = useState<any[]>([]);
  const [transports, setTransports] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  // UI state
  const [selectedZone, setSelectedZone] = useState<any>(null);
  const [language, setLanguage] = useState<string>("English");
  const [chatTab, setChatTab] = useState<"navigate" | "accessibility" | "transport">("navigate");
  
  // AI Chat States
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<any[]>([
    { role: "assistant", text: "Welcome to StadiumIQ! Ask me directions, step-free access routes, or departures advice." }
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Sustainability states
  const [points, setPoints] = useState(0);
  const [recycleMessage, setRecycleMessage] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll chat history to bottom
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatHistory]);

  useEffect(() => {
    const socket = io(API_URL);

    socket.on("initial_state", (data) => {
      setZones(data.zones);
      setTransports(data.transports);
      setMetrics(data.metrics);
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

    socket.on("alert_broadcast", (newAlert) => {
      setAlerts((prev) => [newAlert, ...prev]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Helper to determine color code based on density ratio
  const getDensityColorClass = (current: number, capacity: number) => {
    const ratio = current / capacity;
    if (ratio >= 0.8) return "zone-critical";
    if (ratio >= 0.5) return "zone-warning";
    return "zone-normal";
  };

  const getDensityColor = (current: number, capacity: number) => {
    const ratio = current / capacity;
    if (ratio >= 0.8) return "#E63946"; // Red
    if (ratio >= 0.5) return "#FFC107"; // Gold
    return "#00A651"; // Green
  };

  // Submit AI Chat
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userText = chatInput;
    setChatHistory((prev) => [...prev, { role: "user", text: userText }]);
    setChatInput("");
    setIsAiLoading(true);

    try {
      let endpoint = "/api/ai/navigate";
      if (chatTab === "accessibility") endpoint = "/api/ai/accessibility";
      else if (chatTab === "transport") endpoint = "/api/ai/transport";

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, language }),
      });

      const data = await res.json();
      setChatHistory((prev) => [...prev, { role: "assistant", text: data.response }]);
    } catch (err) {
      setChatHistory((prev) => [
        ...prev, 
        { role: "assistant", text: "Sorry, I am having trouble connecting to StadiumIQ AI. Please check your network." }
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Quick Chat trigger when clicking a zone
  const handleZoneClick = (zone: any) => {
    setSelectedZone(zone);
    const capacityPercent = Math.round((zone.current_count / zone.capacity) * 100);
    setChatInput(`Where is ${zone.name} and how busy is it?`);
  };

  // Log Recycle Action
  const handleRecycle = async () => {
    try {
      const res = await fetch(`${API_URL}/api/sustainability/recycle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: 5 }),
      });
      const data = await res.json();
      setPoints((prev) => prev + 50);
      setRecycleMessage("Success! Recycled 5 lbs of plastic. You earned +50 points!");
      setTimeout(() => setRecycleMessage(""), 4000);
    } catch (err) {
      console.error("Recycle logging failed", err);
    }
  };

  // Find dynamic values for sustainability
  const waterVal = Math.round(metrics.find((m) => m.metric_type === "water")?.value || 0);
  const energyVal = Math.round(metrics.find((m) => m.metric_type === "energy")?.value || 0);
  const wasteVal = Math.round(metrics.find((m) => m.metric_type === "waste")?.value || 0);

  return (
    <div className="min-h-screen bg-[#F7F9FB] flex flex-col">
      {/* Header */}
      <header className="bg-[#0F2C4C] text-white py-4 px-6 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#FFC107] text-[#0F2C4C] rounded-lg">
            <Compass className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">StadiumIQ <span className="text-[#FFC107]">Fan Portal</span></h1>
            <p className="text-[10px] text-slate-300 font-light">FIFA World Cup 2026 Operations</p>
          </div>
        </div>

        {/* Global Settings & Back */}
        <div className="flex items-center gap-4">
          {/* Language Selector */}
          <div className="flex items-center gap-1 bg-white/10 px-3 py-1.5 rounded-lg border border-white/20">
            <Globe className="h-4 w-4 text-[#FFC107]" />
            <select 
              value={language} 
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
            >
              <option className="text-slate-800" value="English">English</option>
              <option className="text-slate-800" value="Spanish">Español</option>
              <option className="text-slate-800" value="French">Français</option>
              <option className="text-slate-800" value="Portuguese">Português</option>
              <option className="text-slate-800" value="Arabic">العربية</option>
              <option className="text-slate-800" value="Hindi">हिन्दी</option>
            </select>
          </div>
          <Link href="/" className="text-xs text-slate-300 hover:text-white transition-colors">
            Exit Dashboard
          </Link>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Hand: Interactive Map & Live Stats (7 cols) */}
        <section className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Interactive Heatmap Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg text-[#0F2C4C] flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-[#00A651]" /> Interactive Crowd Heatmap
                </h3>
                <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-1 rounded-full animate-pulse">
                  ● Live updates active
                </span>
              </div>
              <p className="text-xs text-slate-500 mb-6 font-light">
                Hover over zones to view real-time capacities. Click a zone to load directions in the AI chat assistant.
              </p>
            </div>

            {/* Stadium SVG Mockup */}
            <div className="relative border border-slate-100 bg-slate-50/50 rounded-xl p-6 flex justify-center items-center overflow-x-auto min-h-[300px]">
              <svg viewBox="0 0 800 450" className="w-full max-w-[640px] h-auto">
                {/* Outer Ring boundary */}
                <ellipse cx="400" cy="225" rx="320" ry="180" fill="none" stroke="#e2e8f0" strokeWidth="6" strokeDasharray="5,5" />
                
                {/* 1. Metro station indicator */}
                <g onClick={() => handleZoneClick(zones.find(z => z.id === 'zone-transport-metro') || {})} className="cursor-pointer">
                  <rect x="680" y="200" width="80" height="50" rx="6" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" />
                  <text x="720" y="230" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#0F2C4C">Metro Link</text>
                  <circle cx="720" cy="210" r="6" fill={getDensityColor(zones.find(z => z.id === 'zone-transport-metro')?.current_count, zones.find(z => z.id === 'zone-transport-metro')?.capacity || 100)} />
                </g>

                {/* 2. Shuttle bus indicator */}
                <g onClick={() => handleZoneClick(zones.find(z => z.id === 'zone-transport-shuttle') || {})} className="cursor-pointer">
                  <rect x="360" y="10" width="80" height="40" rx="6" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" />
                  <text x="400" y="34" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#0F2C4C">Shuttle Hub</text>
                  <circle cx="400" cy="18" r="6" fill={getDensityColor(zones.find(z => z.id === 'zone-transport-shuttle')?.current_count, zones.find(z => z.id === 'zone-transport-shuttle')?.capacity || 100)} />
                </g>

                {/* 3. Parking Lots */}
                <g onClick={() => handleZoneClick(zones.find(z => z.id === 'zone-transport-p1') || {})} className="cursor-pointer">
                  <rect x="30" y="100" width="70" height="40" rx="6" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" />
                  <text x="65" y="124" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#0F2C4C">Parking P1</text>
                  <circle cx="65" cy="108" r="6" fill={getDensityColor(zones.find(z => z.id === 'zone-transport-p1')?.current_count, zones.find(z => z.id === 'zone-transport-p1')?.capacity || 100)} />
                </g>
                <g onClick={() => handleZoneClick(zones.find(z => z.id === 'zone-transport-p2') || {})} className="cursor-pointer">
                  <rect x="30" y="280" width="70" height="40" rx="6" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" />
                  <text x="65" y="304" textAnchor="middle" fontSize="10" fontWeight="bold" fill="#0F2C4C">Parking P2</text>
                  <circle cx="65" cy="288" r="6" fill={getDensityColor(zones.find(z => z.id === 'zone-transport-p2')?.current_count, zones.find(z => z.id === 'zone-transport-p2')?.capacity || 100)} />
                </g>

                {/* Stadium Outer Bowl */}
                <ellipse cx="400" cy="225" rx="260" ry="140" fill="#f8fafc" stroke="#64748b" strokeWidth="3" />

                {/* Concourse Level 1 */}
                <ellipse cx="400" cy="225" rx="220" ry="110" fill="none" stroke="#e2e8f0" strokeWidth="24" />
                <path 
                  d="M 180,225 A 220,110 0 0,1 620,225" 
                  fill="none" 
                  stroke={getDensityColor(zones.find(z => z.id === 'zone-concourse-l1')?.current_count, zones.find(z => z.id === 'zone-concourse-l1')?.capacity || 100)} 
                  strokeWidth="20" 
                  opacity="0.75"
                  className="cursor-pointer hover:opacity-100 transition-opacity"
                  onClick={() => handleZoneClick(zones.find(z => z.id === 'zone-concourse-l1') || {})}
                />
                
                {/* Concourse Level 2 */}
                <ellipse cx="400" cy="225" rx="220" ry="110" fill="none" />
                <path 
                  d="M 180,225 A 220,110 0 0,0 620,225" 
                  fill="none" 
                  stroke={getDensityColor(zones.find(z => z.id === 'zone-concourse-l2')?.current_count, zones.find(z => z.id === 'zone-concourse-l2')?.capacity || 100)} 
                  strokeWidth="20" 
                  opacity="0.75"
                  className="cursor-pointer hover:opacity-100 transition-opacity"
                  onClick={() => handleZoneClick(zones.find(z => z.id === 'zone-concourse-l2') || {})}
                />

                {/* Gates surrounding the bowl */}
                {/* Gate A - North */}
                <circle 
                  cx="400" cy="85" r="16" 
                  className={getDensityColorClass(zones.find(z => z.id === 'zone-gate-a')?.current_count || 0, zones.find(z => z.id === 'zone-gate-a')?.capacity || 1)} 
                  onClick={() => handleZoneClick(zones.find(z => z.id === 'zone-gate-a') || {})} 
                />
                <text x="400" y="89" textAnchor="middle" fontSize="11" fontWeight="bold" fill="white" className="pointer-events-none">A</text>

                {/* Gate B - South */}
                <circle 
                  cx="400" cy="365" r="16" 
                  className={getDensityColorClass(zones.find(z => z.id === 'zone-gate-b')?.current_count || 0, zones.find(z => z.id === 'zone-gate-b')?.capacity || 1)} 
                  onClick={() => handleZoneClick(zones.find(z => z.id === 'zone-gate-b') || {})} 
                />
                <text x="400" y="369" textAnchor="middle" fontSize="11" fontWeight="bold" fill="white" className="pointer-events-none">B</text>

                {/* Gate C - East */}
                <circle 
                  cx="620" cy="225" r="16" 
                  className={getDensityColorClass(zones.find(z => z.id === 'zone-gate-c')?.current_count || 0, zones.find(z => z.id === 'zone-gate-c')?.capacity || 1)} 
                  onClick={() => handleZoneClick(zones.find(z => z.id === 'zone-gate-c') || {})} 
                />
                <text x="620" y="229" textAnchor="middle" fontSize="11" fontWeight="bold" fill="white" className="pointer-events-none">C</text>

                {/* Gate D - West */}
                <circle 
                  cx="180" cy="225" r="16" 
                  className={getDensityColorClass(zones.find(z => z.id === 'zone-gate-d')?.current_count || 0, zones.find(z => z.id === 'zone-gate-d')?.capacity || 1)} 
                  onClick={() => handleZoneClick(zones.find(z => z.id === 'zone-gate-d') || {})} 
                />
                <text x="180" y="229" textAnchor="middle" fontSize="11" fontWeight="bold" fill="white" className="pointer-events-none">D</text>

                {/* Inner Seating Stands */}
                {/* North Stand */}
                <path 
                  d="M 230,225 A 170,80 0 0,1 570,225 L 530,225 A 130,50 0 0,0 270,225 Z" 
                  className={getDensityColorClass(zones.find(z => z.id === 'zone-seating-north')?.current_count || 0, zones.find(z => z.id === 'zone-seating-north')?.capacity || 1)} 
                  onClick={() => handleZoneClick(zones.find(z => z.id === 'zone-seating-north') || {})}
                />
                
                {/* South Stand */}
                <path 
                  d="M 230,225 A 170,80 0 0,0 570,225 L 530,225 A 130,50 0 0,1 270,225 Z" 
                  className={getDensityColorClass(zones.find(z => z.id === 'zone-seating-south')?.current_count || 0, zones.find(z => z.id === 'zone-seating-south')?.capacity || 1)} 
                  onClick={() => handleZoneClick(zones.find(z => z.id === 'zone-seating-south') || {})}
                />

                {/* Pitch (Green Rectangle in Center) */}
                <rect x="330" y="195" width="140" height="60" rx="3" fill="#00A651" stroke="#ffffff" strokeWidth="2" opacity="0.9" />
                <line x1="400" y1="195" x2="400" y2="255" stroke="#ffffff" strokeWidth="1.5" />
                <circle cx="400" cy="225" r="15" fill="none" stroke="#ffffff" strokeWidth="1.5" />
              </svg>
            </div>

            {/* Heatmap Legend */}
            <div className="flex justify-center gap-6 mt-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-[#00A651]">
                <span className="h-3 w-3 bg-[#00A651] rounded-full" /> Smooth (&lt; 50%)
              </span>
              <span className="flex items-center gap-1.5 text-amber-500">
                <span className="h-3 w-3 bg-[#FFC107] rounded-full" /> Moderate (50-80%)
              </span>
              <span className="flex items-center gap-1.5 text-[#E63946]">
                <span className="h-3 w-3 bg-[#E63946] rounded-full animate-ping" /> Congested (&gt; 80%)
              </span>
            </div>
          </div>

          {/* Selected Zone Detail Panel */}
          {selectedZone && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm animate-slide-up flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h4 className="font-bold text-[#0F2C4C] text-md">{selectedZone.name}</h4>
                <p className="text-xs text-slate-400 font-light mt-0.5">Role Type: <span className="capitalize font-medium text-slate-600">{selectedZone.type}</span></p>
                
                {/* Accessibility Indicators */}
                <div className="flex gap-2 mt-3">
                  {selectedZone.accessibility_flags && JSON.parse(selectedZone.accessibility_flags).map((flag: string) => (
                    <span key={flag} className="text-[10px] bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded-full capitalize font-medium flex items-center gap-1">
                      <Accessibility className="h-3 w-3" /> {flag.replace('_', ' ')}
                    </span>
                  ))}
                  {(!selectedZone.accessibility_flags || JSON.parse(selectedZone.accessibility_flags).length === 0) && (
                    <span className="text-[10px] text-slate-400 font-light italic">No accessibility flags configured for this zone.</span>
                  )}
                </div>
              </div>

              {/* Occupancy Indicator */}
              <div className="w-full md:w-fit text-right bg-slate-50 border border-slate-100 p-3 rounded-xl min-w-[160px]">
                <div className="text-xs text-slate-400 mb-1 font-light">Occupancy load</div>
                <div className="text-lg font-extrabold text-[#0F2C4C]">
                  {selectedZone.current_count.toLocaleString()} <span className="text-xs font-normal text-slate-400">/ {selectedZone.capacity.toLocaleString()}</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1.5">
                  <div 
                    className="h-full rounded-full transition-all duration-500" 
                    style={{ 
                      width: `${Math.min(100, (selectedZone.current_count / selectedZone.capacity) * 100)}%`,
                      backgroundColor: getDensityColor(selectedZone.current_count, selectedZone.capacity)
                    }} 
                  />
                </div>
              </div>
            </div>
          )}

          {/* Transit Options & Sustainability Quick Meters Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Transit Departures Widget */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
              <h3 className="font-bold text-md text-[#0F2C4C] flex items-center gap-2 mb-4">
                <Bus className="h-5 w-5 text-amber-500" /> Transit Departures Live
              </h3>
              <div className="space-y-3">
                {transports.map((t) => (
                  <div key={t.id} className="flex justify-between items-center text-sm border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                    <div>
                      <p className="font-semibold text-slate-700">{t.name}</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider font-light">{t.type}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#0F2C4C]">{t.eta} mins</p>
                      <p className="text-[10px] font-medium" style={{ color: getDensityColor(t.load_percent, 100) }}>
                        {t.load_percent}% load
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sustainability Meters */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-md text-[#0F2C4C] flex items-center gap-2 mb-4">
                  <Award className="h-5 w-5 text-[#00A651]" /> Smart Eco-Tracker
                </h3>
                <div className="grid grid-cols-3 gap-2 text-center mb-4">
                  <div className="bg-slate-50 border border-slate-100 p-2 rounded-xl">
                    <span className="block text-sm font-extrabold text-[#00A651]">{wasteVal} lbs</span>
                    <span className="text-[8px] text-slate-400 uppercase font-bold tracking-wider">Recycled</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-2 rounded-xl">
                    <span className="block text-sm font-extrabold text-[#0F2C4C]">{waterVal} gal</span>
                    <span className="text-[8px] text-slate-400 uppercase font-bold tracking-wider">Water Used</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-100 p-2 rounded-xl">
                    <span className="block text-sm font-extrabold text-[#0F2C4C]">{energyVal} kWh</span>
                    <span className="text-[8px] text-slate-400 uppercase font-bold tracking-wider">Energy Used</span>
                  </div>
                </div>
              </div>

              {/* Log Action Button */}
              <button 
                onClick={handleRecycle}
                className="w-full bg-[#00A651] hover:bg-[#00A651]/95 text-white py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                <Trash2 className="h-4 w-4" /> Log Recycling (+50 points)
              </button>
              
              {recycleMessage && (
                <p className="text-[10px] text-center text-[#00A651] font-semibold mt-2 animate-bounce">
                  {recycleMessage}
                </p>
              )}
            </div>

          </div>

        </section>

        {/* Right Hand: Multi-tab AI Assistant (5 cols) */}
        <section className="lg:col-span-5 flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden h-[640px]">
          
          {/* Tab Selector */}
          <div className="bg-slate-50 border-b border-slate-200 flex text-xs">
            <button 
              onClick={() => setChatTab("navigate")}
              className={`flex-1 py-3.5 font-bold border-b-2 flex justify-center items-center gap-1.5 transition-colors ${
                chatTab === "navigate" ? "border-[#00A651] text-[#00A651]" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <Navigation className="h-3.5 w-3.5" /> Wayfinding
            </button>
            <button 
              onClick={() => setChatTab("accessibility")}
              className={`flex-1 py-3.5 font-bold border-b-2 flex justify-center items-center gap-1.5 transition-colors ${
                chatTab === "accessibility" ? "border-[#00A651] text-[#00A651]" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <Accessibility className="h-3.5 w-3.5" /> Accessibility
            </button>
            <button 
              onClick={() => setChatTab("transport")}
              className={`flex-1 py-3.5 font-bold border-b-2 flex justify-center items-center gap-1.5 transition-colors ${
                chatTab === "transport" ? "border-[#00A651] text-[#00A651]" : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              <Bus className="h-3.5 w-3.5" /> Departures
            </button>
          </div>

          {/* Points Meter */}
          <div className="bg-[#0F2C4C] text-white py-2 px-4 flex justify-between items-center text-xs">
            <div className="flex items-center gap-1.5">
              <Award className="h-4 w-4 text-[#FFC107]" />
              <span className="font-semibold text-[10px] tracking-wider uppercase text-slate-300">My Fan Score:</span>
            </div>
            <span className="font-extrabold text-[#FFC107]">{points} pts</span>
          </div>

          {/* Chat Messages Log */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
            {chatHistory.map((ch, idx) => (
              <div 
                key={idx} 
                className={`flex ${ch.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
              >
                <div 
                  className={`max-w-[85%] rounded-2xl p-3.5 text-xs shadow-sm leading-relaxed ${
                    ch.role === 'user' 
                      ? 'bg-[#0F2C4C] text-white rounded-br-none' 
                      : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{ch.text}</p>
                </div>
              </div>
            ))}
            
            {isAiLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-100 rounded-2xl p-3.5 rounded-bl-none text-xs text-slate-400 flex items-center gap-2">
                  <Loader2 className="h-4.5 w-4.5 animate-spin text-[#00A651]" />
                  <span>StadiumIQ AI is thinking...</span>
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input Field */}
          <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-white flex gap-2">
            <input 
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder={`Ask ${chatTab === 'navigate' ? 'how to get somewhere...' : chatTab === 'accessibility' ? 'about step-free routes...' : 'best times to depart...'}`}
              className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#00A651]"
            />
            <button 
              type="submit"
              disabled={isAiLoading}
              className="bg-[#00A651] text-white px-4 py-2 rounded-xl text-xs hover:bg-[#00A651]/90 transition-colors flex items-center justify-center shrink-0 disabled:opacity-50"
            >
              <Send className="h-4.5 w-4.5" />
            </button>
          </form>

        </section>

      </main>
      
      {/* Active Global Alert Marquee */}
      {alerts.length > 0 && (
        <div className="bg-[#E63946] text-white py-2 px-6 text-xs flex items-center gap-2 font-semibold">
          <AlertTriangle className="h-4 w-4 shrink-0 animate-bounce" />
          <div className="overflow-hidden relative w-full h-4">
            <span className="absolute animate-[marquee_20s_linear_infinite] whitespace-nowrap">
              ALERT: {alerts[0].message} ({new Date(alerts[0].timestamp).toLocaleTimeString()})
            </span>
          </div>
        </div>
      )}
      
      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}
