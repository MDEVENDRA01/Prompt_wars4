/* eslint-disable */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Users, ShieldAlert, Cpu, Activity, Globe, Compass } from "lucide-react";
import io from "socket.io-client";

export default function Home() {
  const [backendStatus, setBackendStatus] = useState<"connecting" | "online" | "offline">("connecting");
  const [alerts, setAlerts] = useState<any[]>([]);
  const [systemStats, setSystemStats] = useState({
    totalZones: 14,
    activeIncidents: 0,
    transitOptions: 5
  });

  useEffect(() => {
    // Try to connect to backend Socket.io
    const socket = io("http://localhost:3001");

    socket.on("connect", () => {
      setBackendStatus("online");
    });

    socket.on("connect_error", () => {
      setBackendStatus("offline");
    });

    socket.on("initial_state", (data) => {
      setAlerts(data.alerts.slice(0, 3));
      const active = data.incidents.filter((i: any) => i.status !== "resolved").length;
      setSystemStats({
        totalZones: data.zones.length,
        activeIncidents: active,
        transitOptions: data.transports.length
      });
    });

    socket.on("alert_broadcast", (alert) => {
      setAlerts((prev) => [alert, ...prev].slice(0, 3));
    });

    socket.on("incident_update", (incidents) => {
      const active = incidents.filter((i: any) => i.status !== "resolved").length;
      setSystemStats(prev => ({ ...prev, activeIncidents: active }));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F9FB] flex flex-col">
      {/* Top Banner - Interactive System Status */}
      <div className="bg-[#0F2C4C] text-white py-3 px-6 text-sm flex justify-between items-center border-b border-white/10">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-[#FFC107] animate-pulse" />
          <span className="font-semibold text-xs tracking-wider uppercase text-slate-300">FIFA World Cup 2026 Matchday Command</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">AI Core:</span>
            <span className="flex items-center gap-1 text-xs text-[#FFC107] bg-yellow-400/10 px-2 py-0.5 rounded-full border border-yellow-400/20">
              <Cpu className="h-3 w-3" /> Claude 3.5 Sonnet
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400">Backend:</span>
            <span className={`h-2.5 w-2.5 rounded-full ${
              backendStatus === "online" ? "bg-[#00A651]" : backendStatus === "offline" ? "bg-[#E63946]" : "bg-orange-400 animate-pulse"
            }`} />
            <span className="text-xs font-medium capitalize text-slate-300">
              {backendStatus}
            </span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto w-full px-6 py-12 flex-1 flex flex-col justify-center">
        {/* Header */}
        <div className="text-center mb-12 animate-slide-up">
          <h1 className="text-5xl font-extrabold tracking-tight text-[#0F2C4C] mb-4 flex items-center justify-center gap-3">
            Stadium<span className="text-[#FFC107]">IQ</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-xl mx-auto font-light leading-relaxed">
            GenAI-powered command center and real-time operations engine for match day logistics, crowd safety, and fan services.
          </p>
        </div>

        {/* Live Stadium Alerts Banner */}
        {alerts.length > 0 && (
          <div className="max-w-4xl mx-auto w-full mb-8 bg-[#E63946]/5 border-l-4 border-[#E63946] p-4 rounded-r-xl shadow-sm animate-slide-up">
            <div className="flex gap-3">
              <ShieldAlert className="h-5 w-5 text-[#E63946] shrink-0" />
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#E63946] mb-1">Active Command Alerts</h4>
                <div className="space-y-1">
                  {alerts.map((al, idx) => (
                    <p key={idx} className="text-sm text-slate-700 font-medium">
                      • {al.message}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Role Selector Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto w-full mb-12">
          {/* Card 1: Fan */}
          <Link href="/fan" className="group">
            <div className="h-full bg-white border border-slate-200/80 rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#00A651]/5 rounded-bl-full group-hover:bg-[#00A651]/10 transition-colors" />
              <div>
                <div className="p-4 bg-[#00A651]/10 text-[#00A651] rounded-xl w-fit mb-6">
                  <Compass className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-bold text-[#0F2C4C] mb-3 group-hover:text-[#00A651] transition-colors">
                  Fan Portal
                </h2>
                <p className="text-slate-500 text-sm leading-relaxed mb-6 font-light">
                  Multilingual navigation assistant, interactive crowd density heatmap, step-free accessibility support, and transport times.
                </p>
              </div>
              <span className="text-[#00A651] text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
                Enter Portal &rarr;
              </span>
            </div>
          </Link>

          {/* Card 2: Volunteer */}
          <Link href="/volunteer" className="group">
            <div className="h-full bg-white border border-slate-200/80 rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#FFC107]/5 rounded-bl-full group-hover:bg-[#FFC107]/10 transition-colors" />
              <div>
                <div className="p-4 bg-[#FFC107]/10 text-[#FFC107] rounded-xl w-fit mb-6">
                  <Users className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-bold text-[#0F2C4C] mb-3 group-hover:text-amber-500 transition-colors">
                  Staff & Volunteers
                </h2>
                <p className="text-slate-500 text-sm leading-relaxed mb-6 font-light">
                  AI-assisted incident reporting, real-time Kanban task management, instant translation modules, and active zone assignments.
                </p>
              </div>
              <span className="text-amber-500 text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
                Access Dashboard &rarr;
              </span>
            </div>
          </Link>

          {/* Card 3: Organizer */}
          <Link href="/admin" className="group">
            <div className="h-full bg-white border border-slate-200/80 rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#0F2C4C]/5 rounded-bl-full group-hover:bg-[#0F2C4C]/10 transition-colors" />
              <div>
                <div className="p-4 bg-[#0F2C4C]/10 text-[#0F2C4C] rounded-xl w-fit mb-6">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <h2 className="text-2xl font-bold text-[#0F2C4C] mb-3 group-hover:text-[#FFC107] transition-colors">
                  Command Ops
                </h2>
                <p className="text-slate-500 text-sm leading-relaxed mb-6 font-light">
                  Live KPI center, weather / emergency decision simulator, operational briefings, multilingual broadcast utility, and post-match summaries.
                </p>
              </div>
              <span className="text-[#0F2C4C] text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
                Open Command &rarr;
              </span>
            </div>
          </Link>
        </div>

        {/* Dashboard Status Info */}
        <div className="max-w-2xl mx-auto w-full grid grid-cols-3 gap-6 border-t border-slate-200 pt-8 text-center text-xs text-slate-400">
          <div>
            <span className="block text-lg font-bold text-[#0F2C4C]">{systemStats.totalZones}</span>
            Monitored Gates & Zones
          </div>
          <div>
            <span className="block text-lg font-bold text-[#0F2C4C]">{systemStats.activeIncidents}</span>
            Active Operational Tasks
          </div>
          <div>
            <span className="block text-lg font-bold text-[#0F2C4C]">{systemStats.transitOptions}</span>
            Live Transport Feeds
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="py-6 border-t border-slate-200/60 bg-white text-center text-xs text-slate-400">
        StadiumIQ command dashboard for FIFA World Cup 2026 operations. All sensor feeds simulated.
      </div>
    </div>
  );
}
