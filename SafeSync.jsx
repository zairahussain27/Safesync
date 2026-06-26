import { useState, useEffect, useRef, useCallback } from "react";

/* ═══════════════════════════════════════════════════════════════
   DESIGN TOKENS — Blueprint Command Center
   Navy-black base · Indigo AI layer · Arterial red danger
   Space Grotesk UI · Space Mono data
═══════════════════════════════════════════════════════════════ */
const injectGlobals = () => {
  if (document.getElementById("ss-global")) return;
  const s = document.createElement("style");
  s.id = "ss-global";
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { height: 100%; }
    ::-webkit-scrollbar { width: 3px; height: 3px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #1E2D4A; border-radius: 2px; }

    @keyframes heatBloom {
      0%,100% { r: 0; opacity: 0.6; }
      50%      { r: 14; opacity: 0; }
    }
    @keyframes critRing {
      0%   { stroke-width: 0.8; opacity: 0.9; r: var(--r0); }
      100% { stroke-width: 0; opacity: 0; r: var(--r1); }
    }
    @keyframes warnPulse {
      0%,100% { opacity: 0.7; }
      50%      { opacity: 1; }
    }
    @keyframes slideUp {
      from { transform: translateY(20px); opacity: 0; }
      to   { transform: translateY(0);    opacity: 1; }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes logSlide {
      from { transform: translateX(-8px); opacity: 0; }
      to   { transform: translateX(0);    opacity: 1; }
    }
    @keyframes scanH {
      0%   { transform: translateY(0%); opacity: 0.6; }
      100% { transform: translateY(100vh); opacity: 0; }
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    @keyframes tickerScroll {
      0%   { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    @keyframes bang {
      0%   { transform: scale(0.96); }
      50%  { transform: scale(1.02); }
      100% { transform: scale(1); }
    }
    @keyframes numberTick {
      0%,100% { transform: translateY(0); }
      50%     { transform: translateY(-2px); }
    }

    .slide-up    { animation: slideUp  0.4s cubic-bezier(0.16,1,0.3,1) both; }
    .fade-in     { animation: fadeIn   0.35s ease both; }
    .log-entry   { animation: logSlide 0.2s ease both; }
    .num-tick    { animation: numberTick 0.3s ease; }
    .crit-bang   { animation: bang 0.25s ease; }

    .btn-primary:hover  { filter: brightness(1.12); }
    .btn-ghost:hover    { background: #6C63FF18 !important; }
    .zone-hover:hover   { filter: brightness(1.15); cursor: pointer; }
    .tab-btn:hover      { color: #A8B8D8 !important; }

    .scanline {
      position: fixed; top: 0; left: 0; right: 0; height: 1px;
      background: linear-gradient(90deg, transparent 0%, #6C63FF44 50%, transparent 100%);
      animation: scanH 8s linear infinite;
      pointer-events: none; z-index: 999;
    }
  `;
  document.head.appendChild(s);
};

const D = {
  void:     "#050911",
  abyss:    "#080E1A",
  deep:     "#0B1220",
  navy:     "#0F1929",
  ocean:    "#142035",
  surface:  "#192845",
  ridge:    "#1E304F",
  wire:     "#253A58",
  dim:      "#3A5275",
  muted:    "#567090",
  steel:    "#8BA8C8",
  ghost:    "#B8CDE0",
  cloud:    "#D8E8F5",
  white:    "#F0F6FF",

  indigo:   "#6C63FF",
  violet:   "#9B8FFF",
  indigoDim:"#6C63FF20",

  safe:     "#00E5A0",
  safeDim:  "#00E5A015",
  warn:     "#FFB020",
  warnDim:  "#FFB02018",
  crit:     "#FF1744",
  critDim:  "#FF174418",
  critGlow: "#FF174440",
};

/* ═══════════════════════════════════════════════════════════════
   PLANT DATA
═══════════════════════════════════════════════════════════════ */
const ZONES = [
  { id:"Z1", name:"Coke Oven Battery A",  cx:22,  cy:28, rx:16, ry:13, workers:6 },
  { id:"Z2", name:"Gas Treatment Plant",  cx:54,  cy:24, rx:14, ry:11, workers:3 },
  { id:"Z3", name:"Blast Furnace #2",     cx:82,  cy:26, rx:11, ry:14, workers:4 },
  { id:"Z4", name:"Control Room",         cx:16,  cy:62, rx:10, ry:9,  workers:8 },
  { id:"Z5", name:"Maintenance Bay",      cx:44,  cy:65, rx:13, ry:10, workers:5 },
  { id:"Z6", name:"Chemical Storage",     cx:72,  cy:68, rx:11, ry:10, workers:2 },
  { id:"Z7", name:"Exit A",               cx:91,  cy:76, rx:6,  ry:5,  workers:0 },
];

const SENSORS = [
  { id:"S1", zone:"Z1", label:"CO",        full:"Carbon Monoxide",   unit:"ppm",  base:18,  warn:35,  crit:50,  dp:0, lowBad:false },
  { id:"S2", zone:"Z1", label:"H₂S",       full:"Hydrogen Sulphide", unit:"ppm",  base:3,   warn:8,   crit:15,  dp:1, lowBad:false },
  { id:"S3", zone:"Z2", label:"PRES",      full:"Gas Pressure",      unit:"bar",  base:2.1, warn:3.2, crit:4.0, dp:1, lowBad:false },
  { id:"S4", zone:"Z3", label:"TEMP",      full:"Temperature",       unit:"°C",   base:890, warn:1050,crit:1200,dp:0, lowBad:false },
  { id:"S5", zone:"Z6", label:"CH₄",       full:"Methane",           unit:"%LEL", base:5,   warn:20,  crit:40,  dp:0, lowBad:false },
  { id:"S6", zone:"Z1", label:"O₂",        full:"Oxygen Level",      unit:"%",    base:20.9,warn:19.0,crit:16.0,dp:1, lowBad:true  },
];

const PERMITS = [
  { id:"PTW-2847", zone:"Z1", type:"Confined Space Entry", crew:3, status:"active",  start:"06:30", end:"14:30" },
  { id:"PTW-2851", zone:"Z2", type:"Hot Work — Welding",   crew:2, status:"pending", start:"10:00", end:"18:00" },
  { id:"PTW-2839", zone:"Z5", type:"Electrical Isolation", crew:1, status:"active",  start:"07:15", end:"15:15" },
  { id:"PTW-2853", zone:"Z6", type:"Chemical Handling",    crew:2, status:"active",  start:"08:45", end:"12:45" },
];

const HISTORY = [
  { date:"12 Mar 2024", zone:"Z1", event:"Gas accumulation + PTW overlap — near miss",        sev:"High"     },
  { date:"08 Nov 2023", zone:"Z2", event:"Pressure spike coincided with hot-work crew entry", sev:"Critical" },
  { date:"22 Jul 2024", zone:"Z6", event:"CH₄ exceedance during confined-space inspection",   sev:"Medium"   },
];

const REGULATIONS = ["OISD-116","OISD-118","Factory Act §41B","DGFASLI 2024","DGMS Guidelines","IS 15658"];

const SCENARIOS = {
  nominal:  { label:"Nominal operations",          badge:"NOMINAL",  mult:{ S1:1,   S2:1,   S3:1,   S4:1,   S5:1,   S6:1    } },
  elevated: { label:"Elevated risk — Zone 1",      badge:"ELEVATED", mult:{ S1:1.7, S2:2.1, S3:1.4, S4:1.1, S5:1.7, S6:0.97 } },
  vizag:    { label:"Vizag pattern — compound",    badge:"CRITICAL", mult:{ S1:2.7, S2:3.5, S3:2.0, S4:1.06,S5:2.3, S6:0.90 } },
};

function sv(s, scenario, tick) {
  const m = SCENARIOS[scenario].mult[s.id];
  const noise = Math.sin(tick * 0.45 + s.id.charCodeAt(1) * 0.9) * 0.035;
  return +((s.base * m) * (1 + noise)).toFixed(s.dp);
}

function ss(sensor, value) {
  if (sensor.lowBad) {
    if (value <= sensor.crit) return "crit";
    if (value <= sensor.warn) return "warn";
    return "safe";
  }
  if (value >= sensor.crit) return "crit";
  if (value >= sensor.warn) return "warn";
  return "safe";
}

function zoneRisk(zid, vals) {
  const zs = SENSORS.filter(s => s.zone === zid);
  if (!zs.length) return "safe";
  const sts = zs.map(s => ss(s, vals[s.id] ?? s.base));
  if (sts.includes("crit")) return "crit";
  if (sts.includes("warn")) return "warn";
  return "safe";
}

const SC = { safe: D.safe, warn: D.warn, crit: D.crit };
const SD = { safe: D.safeDim, warn: D.warnDim, crit: D.critDim };

/* ═══════════════════════════════════════════════════════════════
   CLAUDE API
═══════════════════════════════════════════════════════════════ */
async function claude(system, user) {
  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model:"claude-sonnet-4-6", max_tokens:1000, system, messages:[{role:"user",content:user}] }),
    });
    const d = await r.json();
    return d.content?.map(b=>b.text||"").join("") || "Agent offline.";
  } catch { return "Agent offline — check connection."; }
}

/* ═══════════════════════════════════════════════════════════════
   MICRO COMPONENTS
═══════════════════════════════════════════════════════════════ */
function Mono({ children, size=11, color, style={} }) {
  return <span style={{ fontFamily:"'Space Mono', monospace", fontSize:size, color:color||D.steel, ...style }}>{children}</span>;
}

function Pill({ children, color, size=10 }) {
  color = color || D.indigo;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:3, fontFamily:"'Space Mono', monospace",
      fontSize:size, fontWeight:700, padding:"2px 7px", borderRadius:3,
      background:color+"1A", color, border:`1px solid ${color}33`, letterSpacing:"0.04em", whiteSpace:"nowrap" }}>
      {children}
    </span>
  );
}

function StatusDot({ status, size=8, glow=false }) {
  const c = SC[status] || D.safe;
  return (
    <span style={{ display:"inline-block", width:size, height:size, borderRadius:"50%", background:c, flexShrink:0,
      boxShadow: glow ? `0 0 ${size}px ${c}, 0 0 ${size*2}px ${c}44` : "none" }} />
  );
}

function Spinner({ size=14, color }) {
  return (
    <span style={{ display:"inline-block", width:size, height:size, border:`2px solid ${D.wire}`,
      borderTopColor: color||D.indigo, borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
      <Mono size={9} color={D.dim} style={{ letterSpacing:"0.14em", textTransform:"uppercase" }}>{children}</Mono>
      <div style={{ flex:1, height:"1px", background:`linear-gradient(90deg, ${D.wire}, transparent)` }} />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PLANT MAP — The Hero
═══════════════════════════════════════════════════════════════ */
function PlantMap({ vals, activeZone, onZone, shiftChange }) {
  const [hov, setHov] = useState(null);
  const [tick2, setTick2] = useState(0);
  useEffect(() => { const id = setInterval(()=>setTick2(t=>t+1), 60); return ()=>clearInterval(id); }, []);

  return (
    <div style={{ position:"relative", width:"100%", borderRadius:12,
      border:`1px solid ${D.wire}`, overflow:"hidden",
      background:`radial-gradient(ellipse at 20% 50%, #0D1A2E 0%, ${D.void} 70%)` }}>

      <svg viewBox="0 0 110 95" style={{ width:"100%", display:"block" }} xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Blueprint grid */}
          <pattern id="grid" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
            <path d="M 10 0 L 0 0 0 10" fill="none" stroke={D.wire} strokeWidth="0.15" opacity="0.4"/>
          </pattern>
          {/* Gradient defs for each zone */}
          {ZONES.map(z => {
            const risk = zoneRisk(z.id, vals);
            const col = SC[risk];
            return (
              <radialGradient key={`rg-${z.id}`} id={`rg-${z.id}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stopColor={col} stopOpacity={risk==="crit"?0.22:risk==="warn"?0.14:0.07}/>
                <stop offset="100%" stopColor={col} stopOpacity="0"/>
              </radialGradient>
            );
          })}
          {/* Critical glow filter */}
          <filter id="critGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.5" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
          <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="0.8" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        {/* Background grid */}
        <rect width="110" height="95" fill="url(#grid)"/>
        <rect width="110" height="95" fill={`url(#rg-Z1)`} opacity="0"/>

        {/* Facility boundary */}
        <rect x="4" y="4" width="102" height="87" rx="2" fill="none" stroke={D.wire} strokeWidth="0.4" strokeDasharray="2 1.5" opacity="0.5"/>

        {/* Pipeline connectors */}
        {[
          [22,28, 54,24], [54,24, 82,26],
          [22,28, 16,62], [22,28, 44,65],
          [54,24, 44,65], [82,26, 72,68],
          [44,65, 72,68], [72,68, 91,76],
        ].map(([x1,y1,x2,y2],i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke={D.wire} strokeWidth="0.35" strokeDasharray="1.5 1" opacity="0.5"/>
        ))}

        {/* Zones */}
        {ZONES.map(z => {
          const risk = zoneRisk(z.id, vals);
          const col = SC[risk];
          const isActive = activeZone === z.id;
          const isHov = hov === z.id;
          const hasPermit = PERMITS.some(p=>p.zone===z.id&&p.status==="active");

          // Animated heat bloom rings for critical zones
          const isCrit = risk === "crit";
          const isWarn = risk === "warn";

          // Pulsing opacity for warn
          const warnOp = isWarn ? 0.65 + Math.sin(tick2 * 0.08) * 0.25 : 1;

          return (
            <g key={z.id} className="zone-hover"
              onClick={() => onZone(z.id === activeZone ? null : z.id)}
              onMouseEnter={() => setHov(z.id)}
              onMouseLeave={() => setHov(null)}
              filter={isCrit ? "url(#critGlow)" : isHov ? "url(#softGlow)" : "none"}
            >
              {/* Heat bloom rings for critical */}
              {isCrit && [0,1,2].map(ring => {
                const phase = (tick2 * 0.04 + ring * 0.33) % 1;
                const maxR = z.rx * 1.8;
                const curR = z.rx * 0.9 + phase * (maxR - z.rx * 0.9);
                const op = (1 - phase) * 0.5;
                return (
                  <ellipse key={ring} cx={z.cx} cy={z.cy}
                    rx={curR} ry={curR * (z.ry/z.rx)}
                    fill="none" stroke={D.crit} strokeWidth="0.4" opacity={op}/>
                );
              })}

              {/* Zone fill — radial gradient */}
              <ellipse cx={z.cx} cy={z.cy} rx={z.rx} ry={z.ry}
                fill={`url(#rg-${z.id})`} opacity={isCrit?1:isWarn?warnOp:0.8}/>

              {/* Zone border */}
              <ellipse cx={z.cx} cy={z.cy} rx={z.rx} ry={z.ry}
                fill="none"
                stroke={isActive ? D.indigo : col}
                strokeWidth={isActive ? 0.9 : isCrit ? 0.7 : 0.45}
                opacity={isActive ? 1 : isCrit ? 1 : isWarn ? warnOp : 0.6}
                strokeDasharray={isActive?"none":"3 1.5"}/>

              {/* Zone ID label */}
              <text x={z.cx} y={z.cy - 1} textAnchor="middle" dominantBaseline="middle"
                fontFamily="'Space Mono', monospace" fontWeight="700" fontSize="3.5"
                fill={col} opacity={isActive?1:0.9}>
                {z.id}
              </text>
              {/* Name label on hover or active */}
              {(isActive || isHov) && (
                <text x={z.cx} y={z.cy + 5.5} textAnchor="middle" dominantBaseline="middle"
                  fontFamily="'Space Grotesk', sans-serif" fontSize="2.3" fill={D.ghost} opacity={0.85}>
                  {z.name}
                </text>
              )}
              {/* Worker count */}
              {z.workers > 0 && (
                <text x={z.cx} y={z.cy + 3} textAnchor="middle" dominantBaseline="middle"
                  fontFamily="'Space Grotesk', sans-serif" fontSize="2.2"
                  fill={col} opacity={0.7}>
                  ▲{z.workers}
                </text>
              )}
              {/* Active permit dot */}
              {hasPermit && (
                <circle cx={z.cx + z.rx - 2} cy={z.cy - z.ry + 2} r="1.5"
                  fill={D.warn} stroke={D.deep} strokeWidth="0.4"/>
              )}
            </g>
          );
        })}

        {/* Compass */}
        <text x="106" y="8" textAnchor="middle" fontFamily="'Space Mono', monospace" fontSize="2.8" fill={D.dim} opacity="0.6">N</text>
        <line x1="106" y1="9" x2="106" y2="13" stroke={D.dim} strokeWidth="0.3" opacity="0.5"/>

        {/* Shift changeover overlay */}
        {shiftChange && (
          <rect x="4" y="4" width="102" height="87" rx="2" fill="none"
            stroke={D.warn} strokeWidth="0.5" strokeDasharray="3 2"
            opacity="0.5"/>
        )}

        {/* Bottom label */}
        <text x="55" y="91" textAnchor="middle"
          fontFamily="'Space Mono', monospace" fontSize="2" fill={D.muted} letterSpacing="0.1em" opacity="0.6">
          VISAKHAPATNAM STEEL PLANT — LIVE SENSOR OVERLAY
        </text>

        {/* Legend */}
        {[{l:"CRITICAL",c:D.crit},{l:"WARNING",c:D.warn},{l:"CLEAR",c:D.safe}].map((item,i)=>(
          <g key={item.l}>
            <circle cx={7 + i*20} cy={8} r="1.2" fill={item.c} opacity="0.85"/>
            <text x={10 + i*20} y={8.8} fontFamily="'Space Mono', monospace" fontSize="1.8" fill={D.muted}>{item.l}</text>
          </g>
        ))}
        <circle cx={67} cy={8} r="1.2" fill={D.warn}/>
        <text x={70} y={8.8} fontFamily="'Space Mono', monospace" fontSize="1.8" fill={D.muted}>ACTIVE PTW</text>
      </svg>

      {shiftChange && (
        <div style={{ position:"absolute", top:10, right:12 }}>
          <Pill color={D.warn}>⏱ SHIFT CHANGEOVER</Pill>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SENSOR CARD GRID
═══════════════════════════════════════════════════════════════ */
function SensorGrid({ vals }) {
  const prevRef = useRef({});
  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:8 }}>
      {SENSORS.map(s => {
        const v = vals[s.id] ?? s.base;
        const prev = prevRef.current[s.id];
        const changed = prev !== undefined && prev !== v;
        prevRef.current[s.id] = v;
        const risk = ss(s, v);
        const col = SC[risk];

        // Fill bar percentage
        const pct = s.lowBad
          ? Math.max(0, Math.min(100, ((v - s.crit*0.8) / (s.base*1.1 - s.crit*0.8)) * 100))
          : Math.max(0, Math.min(100, (v / (s.crit * 1.3)) * 100));

        return (
          <div key={s.id} style={{
            background: D.abyss, borderRadius:10,
            border:`1px solid ${risk==="safe"?D.ridge:col+"55"}`,
            padding:"14px 12px 10px",
            position:"relative", overflow:"hidden",
            boxShadow: risk==="crit" ? `0 0 16px ${col}22, inset 0 0 12px ${col}10` : "none",
            transition:"border-color 0.4s, box-shadow 0.4s",
          }}>
            {/* fill bar at bottom */}
            <div style={{ position:"absolute", bottom:0, left:0, height:3,
              width:`${pct}%`, background:`linear-gradient(90deg, ${col}88, ${col})`,
              borderRadius:2, transition:"width 0.7s ease" }} />

            {/* top row */}
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
              <Mono size={9} color={D.muted} style={{ letterSpacing:"0.1em" }}>{s.label}</Mono>
              <Mono size={8} color={D.dim}>{s.zone}</Mono>
            </div>

            {/* big number */}
            <div className={changed?"num-tick":""} style={{
              fontSize:24, fontWeight:700, fontFamily:"'Space Mono', monospace",
              color:col, lineHeight:1, letterSpacing:"-1.5px",
              textShadow: risk==="crit"?`0 0 12px ${col}88`:"none",
              transition:"color 0.4s",
            }}>
              {v}
            </div>
            <div style={{ marginTop:4, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <Mono size={8.5} color={D.muted}>{s.unit}</Mono>
              <StatusDot status={risk} size={6} glow={risk==="crit"}/>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   AGENT LOG
═══════════════════════════════════════════════════════════════ */
const AGENT_COL = {
  CorrelatorAgent: D.indigo,
  PermitScanAgent: "#B89EFF",
  ResponseAgent:   D.safe,
  SYSTEM:          D.dim,
};

function AgentLog({ entries, maxH=280 }) {
  const ref = useRef(null);
  useEffect(() => { if(ref.current) ref.current.scrollTop = ref.current.scrollHeight; }, [entries]);

  return (
    <div ref={ref} style={{
      maxHeight:maxH, overflowY:"auto",
      background:D.void, borderRadius:8, border:`1px solid ${D.ridge}`,
      padding:"10px 12px",
      fontFamily:"'Space Mono', monospace", fontSize:11, lineHeight:1.9,
    }}>
      {entries.length === 0 && (
        <div style={{ color:D.wire, display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ color:D.indigo, animation:"spin 2s linear infinite", display:"inline-block" }}>◌</span>
          Awaiting agent cycle — select a scenario and press Run
        </div>
      )}
      {entries.map((e,i) => (
        <div key={i} className="log-entry" style={{ display:"flex", gap:0, marginBottom:0 }}>
          <span style={{ color:D.dim, flexShrink:0, minWidth:64 }}>{e.ts}</span>
          <span style={{ color:AGENT_COL[e.agent]||D.steel, flexShrink:0, minWidth:138, paddingRight:8 }}>{e.agent}</span>
          <span style={{ color:e.lv==="crit"?D.crit:e.lv==="warn"?D.warn:e.lv==="safe"?D.safe:D.ghost }}>
            {e.msg}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   COMPOUND RISK BANNER
═══════════════════════════════════════════════════════════════ */
function CompoundBanner({ data, onDismiss }) {
  if (!data) return null;
  return (
    <div className="slide-up crit-bang" style={{
      background:`linear-gradient(135deg, #1A0509 0%, #180610 100%)`,
      border:`1.5px solid ${D.crit}`,
      borderRadius:12, padding:"16px 20px",
      boxShadow:`0 0 30px ${D.critGlow}, inset 0 0 30px ${D.crit}08`,
      position:"relative",
    }}>
      <button onClick={onDismiss} style={{ position:"absolute", top:12, right:14,
        background:"none", border:"none", color:D.muted, cursor:"pointer", fontSize:16, lineHeight:1 }}>×</button>
      <div style={{ display:"flex", gap:16, alignItems:"flex-start" }}>
        <div style={{ flexShrink:0, width:44, height:44, borderRadius:10,
          background:D.critDim, border:`1px solid ${D.crit}55`,
          display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>
          ⚠
        </div>
        <div style={{ flex:1 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
            <Mono size={12} color={D.crit} style={{ fontWeight:700, letterSpacing:"0.05em" }}>
              COMPOUND RISK DETECTED
            </Mono>
            <Pill color={D.crit}>VIZAG PATTERN</Pill>
          </div>
          <div style={{ fontSize:12.5, color:D.ghost, lineHeight:1.7, fontFamily:"'Space Grotesk', sans-serif" }}>
            {data.factors.join("  ·  ")}
            {data.shift && "  ·  Shift changeover in progress"}
          </div>
          <div style={{ marginTop:8, fontSize:12, color:D.crit, fontFamily:"'Space Grotesk', sans-serif", lineHeight:1.6 }}>
            This exact multi-factor pattern preceded the Visakhapatnam Steel Plant fatalities of January 2025.
            Each factor alone would not trigger an alert. SafeSync's compound engine flagged the combination.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STAT ROW (top of page)
═══════════════════════════════════════════════════════════════ */
function StatBar({ vals, scenario }) {
  const critCount = SENSORS.filter(s=>ss(s,vals[s.id]??s.base)==="crit").length;
  const warnCount = SENSORS.filter(s=>ss(s,vals[s.id]??s.base)==="warn").length;
  const activePermits = PERMITS.filter(p=>p.status==="active").length;
  const workers = ZONES.reduce((a,z)=>a+z.workers,0);

  const items = [
    { label:"Workers on site", value:workers, unit:"", color:D.steel },
    { label:"Active permits",  value:activePermits, unit:"PTW", color:D.warn },
    { label:"Critical sensors",value:critCount, unit:"", color:critCount>0?D.crit:D.muted },
    { label:"Warning sensors", value:warnCount, unit:"", color:warnCount>0?D.warn:D.muted },
    { label:"Zones monitored", value:ZONES.length, unit:"", color:D.indigo },
    { label:"Regulations",     value:REGULATIONS.length, unit:"covered", color:D.safe },
  ];

  return (
    <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:8 }}>
      {items.map((item,i) => (
        <div key={i} style={{ background:D.abyss, border:`1px solid ${D.ridge}`, borderRadius:8,
          padding:"12px 14px" }}>
          <div style={{ fontSize:22, fontWeight:700, fontFamily:"'Space Mono', monospace",
            color:item.color, lineHeight:1, letterSpacing:"-1px" }}>
            {item.value}
            {item.unit && <span style={{ fontSize:10, color:D.muted, marginLeft:4 }}>{item.unit}</span>}
          </div>
          <Mono size={9} color={D.muted} style={{ marginTop:5, display:"block", letterSpacing:"0.06em", textTransform:"uppercase" }}>
            {item.label}
          </Mono>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   COMPOUND RISK MATRIX
═══════════════════════════════════════════════════════════════ */
function RiskMatrix({ scenario, shiftChange }) {
  const items = [
    { label:"Gas accumulation + Confined Space Entry",  risk: scenario==="vizag"?"crit":scenario==="elevated"?"warn":"safe", desc:"Exact Vizag pattern" },
    { label:"Hot work permit + Elevated gas pressure",  risk: scenario==="vizag"?"warn":"safe", desc:"Simultaneous ops risk" },
    { label:"Shift changeover + Multiple active PTWs",  risk: shiftChange?"warn":"safe", desc:"Coordination failure window" },
    { label:"O₂ depletion + Workers inside zone",       risk: scenario==="vizag"?"crit":"safe", desc:"Asphyxiation compound" },
    { label:"Multiple gas exceedances simultaneously",   risk: scenario==="vizag"?"crit":scenario==="elevated"?"warn":"safe", desc:"Multi-gas exposure" },
    { label:"SCADA override + Maintenance crew nearby", risk:"safe", desc:"Manual bypass risk" },
  ];

  return (
    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
      {items.map((item,i) => {
        const col = SC[item.risk];
        return (
          <div key={i} style={{ background:D.abyss, border:`1px solid ${col}${item.risk==="safe"?"22":"44"}`,
            borderRadius:8, padding:"12px 14px",
            boxShadow:item.risk==="crit"?`0 0 10px ${col}18`:"none",
            transition:"all 0.4s" }}>
            <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
              <Pill color={col} size={9}>{item.risk.toUpperCase()}</Pill>
            </div>
            <div style={{ fontSize:12.5, color:D.ghost, lineHeight:1.5, marginBottom:4,
              fontFamily:"'Space Grotesk', sans-serif" }}>
              {item.label}
            </div>
            <Mono size={9} color={D.dim}>{item.desc}</Mono>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN APPLICATION
═══════════════════════════════════════════════════════════════ */
export default function SafeSync() {
  useEffect(injectGlobals, []);

  const [scenario,     setScenario]     = useState("nominal");
  const [tick,         setTick]         = useState(0);
  const [vals,         setVals]         = useState({});
  const [shiftChange,  setShiftChange]  = useState(false);
  const [activeTab,    setActiveTab]    = useState("live");
  const [activeZone,   setActiveZone]   = useState(null);
  const [agentLogs,    setAgentLogs]    = useState([]);
  const [agentBusy,    setAgentBusy]    = useState(false);
  const [compound,     setCompound]     = useState(null);
  const [zoneAI,       setZoneAI]       = useState({ text:"", loading:false, zid:null });
  const [reportAI,     setReportAI]     = useState({ text:"", loading:false });
  const [alerts,       setAlerts]       = useState([]);

  /* live tick */
  useEffect(() => {
    const id = setInterval(()=>setTick(t=>t+1), 1100);
    return ()=>clearInterval(id);
  }, []);

  /* compute sensor values + compound detection */
  useEffect(() => {
    const v = {};
    SENSORS.forEach(s => { v[s.id] = sv(s, scenario, tick); });
    setVals(v);

    if (scenario === "vizag") {
      const crits = SENSORS.filter(s=>ss(s,v[s.id])==="crit");
      const riskPTW = PERMITS.filter(p=>p.status==="active"&&crits.some(s=>s.zone===p.zone));
      if (crits.length>=2 && riskPTW.length) {
        setCompound({ factors:crits.map(s=>`${s.full} ${v[s.id]}${s.unit} @ ${s.zone}`), shift:shiftChange });
      }
    } else {
      setCompound(null);
    }
  }, [tick, scenario, shiftChange]);

  const pushLog = useCallback((agent, msg, lv="info") => {
    const ts = new Date().toLocaleTimeString("en-IN",{hour12:false});
    setAgentLogs(l=>[...l.slice(-150),{agent,msg,lv,ts}]);
  },[]);

  /* ── agent cycle ── */
  const runCycle = useCallback(async () => {
    if (agentBusy) return;
    setAgentBusy(true); setAgentLogs([]);

    const sc = scenario;
    const curVals = {}; SENSORS.forEach(s=>{curVals[s.id]=sv(s,sc,tick);});

    pushLog("SYSTEM", `Agent cycle start — scenario: ${SCENARIOS[sc].badge}`);
    await new Promise(r=>setTimeout(r,250));

    // CorrelatorAgent
    pushLog("CorrelatorAgent","Scanning sensor matrix…");
    await new Promise(r=>setTimeout(r,400));
    SENSORS.forEach(s=>{
      const v=curVals[s.id]; const r=ss(s,v);
      pushLog("CorrelatorAgent",`[${s.zone}] ${s.label}: ${v} ${s.unit}  →  ${r.toUpperCase()}`,r);
    });
    await new Promise(r=>setTimeout(r,300));
    pushLog("CorrelatorAgent","Running compound correlation model…");

    const sCtx = SENSORS.map(s=>`${s.id}(${s.zone}) ${s.label}: ${curVals[s.id]}${s.unit} [${ss(s,curVals[s.id]).toUpperCase()}]`).join("\n");
    const cRes = await claude(
      `You are CorrelatorAgent in SafeSync — an AI industrial safety intelligence platform at an Indian steel plant. Detect compound risk: dangerous combinations of sensor readings that no single threshold would flag. Be specific about sensor IDs, zones, and why the combination is dangerous. 3-4 lines. Direct, no preamble.`,
      sCtx + (shiftChange?"\nCONTEXT: Shift changeover active.":"")
    );
    cRes.split("\n").filter(Boolean).forEach(l=>pushLog("CorrelatorAgent",l));
    await new Promise(r=>setTimeout(r,300));

    // PermitScanAgent
    pushLog("PermitScanAgent","Loading permit-to-work register…");
    await new Promise(r=>setTimeout(r,350));
    PERMITS.filter(p=>p.status==="active").forEach(p=>{
      const r=zoneRisk(p.zone,curVals);
      pushLog("PermitScanAgent",`${p.id}  ${p.type}  zone:${p.zone}  zone-risk:${r.toUpperCase()}  crew:${p.crew}`,r);
    });
    const pRes = await claude(
      `You are PermitScanAgent in SafeSync. Cross-reference active work permits against real-time sensor readings. Flag DANGEROUS SIMULTANEOUS OPERATIONS by permit ID and sensor readings. 3-4 lines, no preamble.`,
      PERMITS.map(p=>`${p.id}: ${p.type}, Zone ${p.zone}, crew ${p.crew}, ${p.status}`).join("\n")+"\n\n"+sCtx
    );
    pRes.split("\n").filter(Boolean).forEach(l=>pushLog("PermitScanAgent",l));
    await new Promise(r=>setTimeout(r,300));

    // ResponseAgent
    pushLog("ResponseAgent","Evaluating intervention threshold…");
    await new Promise(r=>setTimeout(r,250));
    const anyCrit = SENSORS.some(s=>ss(s,curVals[s.id])==="crit");

    if (anyCrit || sc==="vizag") {
      pushLog("ResponseAgent","⚠ THRESHOLD EXCEEDED — initiating response protocol","crit");
      const rRes = await claude(
        `You are ResponseAgent in SafeSync. Generate 5 immediate response actions for the safety officer at an Indian steel plant. Include: which PTWs to suspend, which zones to evacuate, who to notify (DGFASLI, Factory Inspector, internal ERT), OISD compliance steps. Numbered list, direct, actionable.`,
        `Facility: Visakhapatnam Steel\nScenario: ${SCENARIOS[sc].label}\nCritical sensors: ${SENSORS.filter(s=>ss(s,curVals[s.id])==="crit").map(s=>s.full+" @ "+s.zone).join(", ")}\nActive PTW: ${PERMITS.filter(p=>p.status==="active").map(p=>p.id).join(", ")}\nShift changeover: ${shiftChange}`
      );
      rRes.split("\n").filter(Boolean).forEach(l=>pushLog("ResponseAgent",l,"crit"));
      setAlerts(a=>[{
        id:Date.now(),
        ts:new Date().toLocaleTimeString("en-IN"),
        msg:`Compound risk — ${[...new Set(SENSORS.filter(s=>ss(s,curVals[s.id])==="crit").map(s=>s.zone))].join(", ")} — PTW suspension recommended`
      },...a.slice(0,9)]);
    } else {
      pushLog("ResponseAgent","No intervention required. All thresholds within safe envelope.","safe");
    }

    pushLog("SYSTEM","─── Cycle complete ───");
    setAgentBusy(false);
  },[agentBusy,scenario,tick,shiftChange,pushLog]);

  const analyzeZone = useCallback(async (zid) => {
    if(!zid) return;
    const z = ZONES.find(x=>x.id===zid);
    setZoneAI({text:"",loading:true,zid});
    const ctx = `Zone: ${z?.name} (${zid})\nWorkers: ${z?.workers}\nSensors: ${SENSORS.filter(s=>s.zone===zid).map(s=>`${s.label}: ${vals[s.id]??s.base}${s.unit} (${ss(s,vals[s.id]??s.base).toUpperCase()})`).join(", ")||"None"}\nPermits: ${PERMITS.filter(p=>p.zone===zid).map(p=>`${p.id} ${p.type} (${p.status})`).join(", ")||"None"}\nShift changeover: ${shiftChange}`;
    const res = await claude(`You are a zone safety analyst in SafeSync. Give a 4-line focused safety assessment. Include: risk level, primary hazard, specific recommended action, applicable regulation (OISD/Factory Act). No preamble.`, ctx);
    setZoneAI({text:res,loading:false,zid});
  },[vals,shiftChange]);

  const genReport = useCallback(async () => {
    setReportAI({text:"",loading:true});
    const ctx = `Facility: Visakhapatnam Steel Plant (Simulated)\nDate: ${new Date().toLocaleString("en-IN")}\nScenario: ${SCENARIOS[scenario].label}\n\nSensors:\n${SENSORS.map(s=>`${s.id}|${s.zone}|${s.full}: ${vals[s.id]??s.base}${s.unit}|${ss(s,vals[s.id]??s.base).toUpperCase()}`).join("\n")}\n\nPermits:\n${PERMITS.filter(p=>p.status==="active").map(p=>`${p.id}: ${p.type}, Zone ${p.zone}, crew ${p.crew}`).join("\n")}\nShift changeover: ${shiftChange}`;
    const res = await claude(`Generate a formal OISD/Factory Act risk assessment. Include: Executive Summary, Sensor Status Table, Compound Risk Analysis, Regulatory Compliance (OISD-116, Factory Act §41B, DGFASLI), Corrective Actions, Notification Requirements. Professional, specific citations.`, ctx);
    setReportAI({text:res,loading:false});
  },[scenario,vals,shiftChange]);

  /* overall status */
  const overall = (() => {
    if (!Object.keys(vals).length) return "safe";
    const sts = SENSORS.map(s=>ss(s,vals[s.id]??s.base));
    if (sts.includes("crit")) return "crit";
    if (sts.includes("warn")) return "warn";
    return "safe";
  })();

  const SCEN_COL = { nominal:D.safe, elevated:D.warn, vizag:D.crit };

  const TABS = [
    { id:"live",    label:"Live Plant" },
    { id:"agents",  label:"AI Agents" },
    { id:"permits", label:"Permits & History" },
    { id:"report",  label:"Incident Report" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:D.void, color:D.white,
      fontFamily:"'Space Grotesk', system-ui, sans-serif", display:"flex", flexDirection:"column" }}>

      {/* ambient scanline */}
      <div className="scanline"/>

      {/* ════════ TOPBAR ════════ */}
      <header style={{ background:D.abyss, borderBottom:`1px solid ${D.ridge}`,
        height:58, display:"flex", alignItems:"center",
        justifyContent:"space-between", padding:"0 24px",
        position:"sticky", top:0, zIndex:60, flexShrink:0 }}>

        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width:36, height:36, borderRadius:10,
            background:`linear-gradient(135deg, ${D.indigo} 0%, #4A3FD4 100%)`,
            display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:`0 0 16px ${D.indigo}44`, fontSize:17, flexShrink:0 }}>
            ◈
          </div>
          <div>
            <div style={{ fontSize:18, fontWeight:700, letterSpacing:"-0.6px",
              background:`linear-gradient(90deg, ${D.white}, ${D.ghost})`,
              WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
              SafeSync
            </div>
            <Mono size={9} color={D.dim} style={{ letterSpacing:"0.14em", textTransform:"uppercase" }}>
              Industrial Safety Intelligence · PS #1
            </Mono>
          </div>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {/* overall status */}
          <div style={{ display:"flex", alignItems:"center", gap:8,
            background:SC[overall]+"14", border:`1px solid ${SC[overall]}33`,
            borderRadius:8, padding:"7px 14px" }}>
            <StatusDot status={overall} size={8} glow={overall==="crit"}/>
            <Mono size={11} color={SC[overall]} style={{ fontWeight:700, letterSpacing:"0.08em" }}>
              {overall==="safe"?"ALL CLEAR":overall==="warn"?"ELEVATED RISK":"CRITICAL ALERT"}
            </Mono>
          </div>

          <div style={{ width:1, height:22, background:D.ridge }}/>

          {/* scenario pills */}
          {Object.entries(SCENARIOS).map(([k,sc])=>(
            <button key={k} onClick={()=>{setScenario(k);setAgentLogs([]);setCompound(null);}} style={{
              background:scenario===k?SCEN_COL[k]+"1E":"transparent",
              border:`1px solid ${scenario===k?SCEN_COL[k]+"66":D.ridge}`,
              borderRadius:6, padding:"5px 12px",
              fontFamily:"'Space Mono', monospace", fontSize:10, fontWeight:700,
              color:scenario===k?SCEN_COL[k]:D.muted, cursor:"pointer",
              transition:"all 0.18s", letterSpacing:"0.06em",
            }}>
              {sc.badge}
            </button>
          ))}

          <div style={{ width:1, height:22, background:D.ridge }}/>

          {/* shift toggle */}
          <label style={{ display:"flex", alignItems:"center", gap:7, cursor:"pointer" }}>
            <div onClick={()=>setShiftChange(v=>!v)} style={{
              width:34, height:18, borderRadius:9,
              background:shiftChange?D.warn+"88":D.ridge,
              position:"relative", transition:"background 0.2s", cursor:"pointer",
              border:`1px solid ${shiftChange?D.warn:D.wire}`,
            }}>
              <div style={{ position:"absolute", top:2, left:shiftChange?17:2,
                width:12, height:12, borderRadius:"50%",
                background:shiftChange?D.warn:D.muted, transition:"left 0.18s" }}/>
            </div>
            <Mono size={9} color={shiftChange?D.warn:D.muted} style={{ letterSpacing:"0.06em", userSelect:"none" }}>
              SHIFT CHANGE
            </Mono>
          </label>

          <div style={{ width:1, height:22, background:D.ridge }}/>
          <Pill color={D.indigo} size={9}>ET AI HACKATHON 2026</Pill>
        </div>
      </header>

      {/* ════════ CONTENT ════════ */}
      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>

        {/* ── LEFT NAV ── */}
        <nav style={{ width:200, background:D.abyss, borderRight:`1px solid ${D.ridge}`,
          display:"flex", flexDirection:"column", padding:"20px 12px", gap:4, flexShrink:0 }}>

          {TABS.map(t=>{
            const active = activeTab===t.id;
            return (
              <button key={t.id} onClick={()=>setActiveTab(t.id)} className="tab-btn" style={{
                textAlign:"left", background:active?D.indigoDim:"transparent",
                border:`1px solid ${active?D.indigo+"55":"transparent"}`,
                borderRadius:8, padding:"10px 13px",
                fontFamily:"'Space Grotesk', sans-serif", fontSize:13, fontWeight:active?600:400,
                color:active?D.indigo:D.muted, cursor:"pointer", transition:"all 0.15s",
              }}>
                {t.label}
              </button>
            );
          })}

          <div style={{ flex:1 }}/>

          {/* alert log */}
          <div>
            <SectionLabel>Alert log</SectionLabel>
            {alerts.length===0 ? (
              <Mono size={10} color={D.wire}>No alerts triggered</Mono>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {alerts.slice(0,4).map(a=>(
                  <div key={a.id} style={{ background:D.critDim, border:`1px solid ${D.crit}33`,
                    borderRadius:6, padding:"7px 9px" }}>
                    <Mono size={9} color={D.crit} style={{ display:"block", marginBottom:2 }}>{a.ts}</Mono>
                    <div style={{ fontSize:10.5, color:D.ghost, lineHeight:1.5 }}>{a.msg}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ marginTop:16, padding:"12px", background:D.deep, borderRadius:8, border:`1px solid ${D.ridge}` }}>
            <Mono size={9} color={D.indigo} style={{ display:"block", marginBottom:6, letterSpacing:"0.08em" }}>REGULATORY COVERAGE</Mono>
            {REGULATIONS.map(r=>(
              <div key={r} style={{ display:"flex", alignItems:"center", gap:6, padding:"3px 0" }}>
                <StatusDot status="safe" size={5}/>
                <Mono size={9} color={D.muted}>{r}</Mono>
              </div>
            ))}
          </div>
        </nav>

        {/* ── MAIN CONTENT ── */}
        <main style={{ flex:1, overflowY:"auto", padding:24, display:"flex", flexDirection:"column", gap:20 }}>

          {/* compound banner */}
          {compound && <CompoundBanner data={compound} onDismiss={()=>setCompound(null)}/>}

          {/* ─ LIVE TAB ─ */}
          {activeTab==="live" && <>
            <StatBar vals={vals} scenario={scenario}/>
            <div>
              <SectionLabel>Plant layout — live sensor overlay</SectionLabel>
              <PlantMap vals={vals} activeZone={activeZone}
                onZone={z=>{setActiveZone(z);setZoneAI({text:"",loading:false,zid:null});}}
                shiftChange={shiftChange}/>
            </div>

            {/* zone analysis */}
            {activeZone && (
              <div className="slide-up" style={{ background:D.abyss, border:`1px solid ${D.ridge}`, borderRadius:12, padding:"18px 20px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
                  <div>
                    <div style={{ fontSize:15, fontWeight:600, marginBottom:4 }}>
                      {ZONES.find(z=>z.id===activeZone)?.name}
                    </div>
                    <div style={{ display:"flex", gap:8 }}>
                      <Pill color={SC[zoneRisk(activeZone,vals)]}>{zoneRisk(activeZone,vals).toUpperCase()}</Pill>
                      <Pill color={D.steel}>▲ {ZONES.find(z=>z.id===activeZone)?.workers} workers</Pill>
                      {PERMITS.some(p=>p.zone===activeZone&&p.status==="active") &&
                        <Pill color={D.warn}>PTW ACTIVE</Pill>}
                    </div>
                  </div>
                  <button onClick={()=>analyzeZone(activeZone)} disabled={zoneAI.loading}
                    className="btn-primary" style={{
                      background:zoneAI.loading?"transparent":D.indigo,
                      border:zoneAI.loading?`1px solid ${D.wire}`:"none",
                      borderRadius:8, padding:"9px 18px",
                      fontFamily:"'Space Grotesk', sans-serif", fontSize:13, fontWeight:600,
                      color:zoneAI.loading?D.muted:"#fff", cursor:zoneAI.loading?"not-allowed":"pointer",
                      display:"flex", alignItems:"center", gap:8, transition:"all 0.2s",
                    }}>
                    {zoneAI.loading?<><Spinner size={13}/>Analyzing…</>:"◈ AI Zone Analysis"}
                  </button>
                </div>
                {zoneAI.text && zoneAI.zid===activeZone && (
                  <div className="fade-in" style={{ background:D.void, borderRadius:8,
                    border:`1px solid ${D.ridge}`, padding:"14px 16px",
                    fontFamily:"'Space Mono', monospace", fontSize:11.5, color:D.ghost, lineHeight:1.9 }}>
                    {zoneAI.text}
                  </div>
                )}
                {!zoneAI.text && !zoneAI.loading && (
                  <Mono size={11} color={D.wire}>Press "AI Zone Analysis" for a real-time safety assessment of this zone.</Mono>
                )}
              </div>
            )}

            <div>
              <SectionLabel>Live sensor readings</SectionLabel>
              <SensorGrid vals={vals}/>
            </div>

            <div>
              <SectionLabel>Compound risk matrix — combinations that single thresholds miss</SectionLabel>
              <RiskMatrix scenario={scenario} shiftChange={shiftChange}/>
            </div>
          </>}

          {/* ─ AGENTS TAB ─ */}
          {activeTab==="agents" && <>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12 }}>
              {[
                { name:"CorrelatorAgent", col:D.indigo,  desc:"Fuses IoT, SCADA, and environmental streams. Identifies compound sensor patterns that no single threshold system would detect." },
                { name:"PermitScanAgent", col:"#B89EFF",  desc:"Cross-references live permit-to-work logs against real-time zone conditions. Flags dangerous simultaneous operations." },
                { name:"ResponseAgent",   col:D.safe,    desc:"On compound threshold breach: generates evacuation order, suspends conflicting PTWs, files OISD-compliant incident record." },
              ].map(a=>(
                <div key={a.name} style={{ background:D.abyss, border:`1px solid ${a.col}33`,
                  borderRadius:12, padding:"16px 16px" }}>
                  <Mono size={12} color={a.col} style={{ display:"block", fontWeight:700, marginBottom:8, letterSpacing:"0.04em" }}>
                    {a.name}
                  </Mono>
                  <div style={{ fontSize:12.5, color:D.steel, lineHeight:1.65 }}>{a.desc}</div>
                </div>
              ))}
            </div>

            <div style={{ background:D.abyss, border:`1px solid ${D.ridge}`, borderRadius:12, padding:"18px 20px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16 }}>
                <div>
                  <div style={{ fontSize:15, fontWeight:600, marginBottom:3 }}>Agent Reasoning Stream</div>
                  <div style={{ fontSize:12, color:D.muted }}>Multi-agent output — powered by Claude AI · 3 agents in sequence</div>
                </div>
                <button onClick={runCycle} disabled={agentBusy} className="btn-primary" style={{
                  background:agentBusy?"transparent":D.indigo,
                  border:agentBusy?`1px solid ${D.wire}`:"none",
                  borderRadius:8, padding:"10px 22px",
                  fontFamily:"'Space Grotesk', sans-serif", fontSize:13, fontWeight:600,
                  color:agentBusy?D.muted:"#fff", cursor:agentBusy?"not-allowed":"pointer",
                  display:"flex", alignItems:"center", gap:9, transition:"all 0.2s",
                }}>
                  {agentBusy?<><Spinner size={14}/>Agents running…</>:"▶ Run Agent Cycle"}
                </button>
              </div>
              <AgentLog entries={agentLogs} maxH={340}/>
            </div>

            <div style={{ background:D.abyss, border:`1px solid ${D.ridge}`, borderRadius:12, padding:"18px 20px" }}>
              <SectionLabel>Why compound detection matters</SectionLabel>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                {[
                  { head:"Single-sensor systems", body:"Alert when CO > 50 ppm. Alert when H₂S > 15 ppm. Each sensor watches its own number in isolation.", col:D.crit },
                  { head:"SafeSync compound engine", body:"CO at 47 ppm + H₂S at 12 ppm + confined space PTW active + shift changeover = imminent fatality risk. Four individually 'safe' readings. One dangerous combination.", col:D.indigo },
                ].map(item=>(
                  <div key={item.head} style={{ background:D.deep, border:`1px solid ${item.col}33`, borderRadius:8, padding:"14px 16px" }}>
                    <div style={{ fontSize:13, fontWeight:600, color:item.col, marginBottom:8 }}>{item.head}</div>
                    <div style={{ fontSize:12.5, color:D.steel, lineHeight:1.7 }}>{item.body}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:14, padding:"12px 14px", background:D.critDim, border:`1px solid ${D.crit}33`, borderRadius:8 }}>
                <div style={{ fontSize:12.5, color:D.ghost, lineHeight:1.7 }}>
                  <strong style={{ color:D.crit }}>Visakhapatnam Steel Plant, January 2025:</strong> Gas pressure sensors showed elevated readings.
                  Permit-to-work logs showed confined space entry. Shift change was in progress.
                  Each piece of data existed in a separate system. <em style={{ color:D.crit }}>No intelligence layer connected them. Eight workers died.</em>
                </div>
              </div>
            </div>
          </>}

          {/* ─ PERMITS TAB ─ */}
          {activeTab==="permits" && <>
            <div>
              <SectionLabel>Permit-to-work register</SectionLabel>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {PERMITS.map(p=>{
                  const risk = zoneRisk(p.zone,vals);
                  const flagged = p.status==="active" && risk!=="safe";
                  const statCol = p.status==="active"?D.safe:p.status==="pending"?D.warn:D.muted;
                  return (
                    <div key={p.id} style={{ background:D.abyss,
                      border:`1px solid ${flagged?SC[risk]+"66":D.ridge}`,
                      borderRadius:12, padding:"16px 18px",
                      boxShadow:flagged?`0 0 16px ${SC[risk]}12`:"none", transition:"all 0.3s" }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                        <div>
                          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:5 }}>
                            <Mono size={13} style={{ fontWeight:700 }}>{p.id}</Mono>
                            {flagged && <Pill color={SC[risk]}>⚠ ZONE {risk.toUpperCase()}</Pill>}
                          </div>
                          <div style={{ fontSize:14, color:D.ghost }}>{p.type}</div>
                        </div>
                        <Pill color={statCol}>{p.status.toUpperCase()}</Pill>
                      </div>
                      <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                        <Pill color={D.steel}>{p.zone}</Pill>
                        <Pill color={D.steel}>▲ {p.crew} workers</Pill>
                        <Pill color={D.steel}>⏱ {p.start} – {p.end}</Pill>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <SectionLabel>Historical incident pattern — reference corpus</SectionLabel>
              <div style={{ background:D.abyss, border:`1px solid ${D.ridge}`, borderRadius:12, overflow:"hidden" }}>
                {HISTORY.map((h,i)=>{
                  const col = h.sev==="Critical"?D.crit:h.sev==="High"?D.warn:D.steel;
                  return (
                    <div key={i} style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
                      padding:"14px 18px", borderBottom:i<HISTORY.length-1?`1px solid ${D.ridge}`:"none" }}>
                      <div>
                        <div style={{ fontSize:13, color:D.ghost, marginBottom:4 }}>{h.event}</div>
                        <div style={{ display:"flex", gap:8 }}>
                          <Mono size={10} color={D.muted}>{h.date}</Mono>
                          <Pill color={D.steel} size={9}>{h.zone}</Pill>
                        </div>
                      </div>
                      <Pill color={col}>{h.sev}</Pill>
                    </div>
                  );
                })}
              </div>
            </div>
          </>}

          {/* ─ REPORT TAB ─ */}
          {activeTab==="report" && (
            <div style={{ background:D.abyss, border:`1px solid ${D.ridge}`, borderRadius:12, padding:"20px 22px" }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18 }}>
                <div>
                  <div style={{ fontSize:16, fontWeight:600, marginBottom:5 }}>OISD-Compliant Incident Risk Report</div>
                  <div style={{ fontSize:12.5, color:D.muted }}>Auto-generated · Factory Act §41B · OISD-116 · DGFASLI standards</div>
                </div>
                <button onClick={genReport} disabled={reportAI.loading} className="btn-primary" style={{
                  background:reportAI.loading?"transparent":D.indigo,
                  border:reportAI.loading?`1px solid ${D.wire}`:"none",
                  borderRadius:8, padding:"10px 20px",
                  fontFamily:"'Space Grotesk', sans-serif", fontSize:13, fontWeight:600,
                  color:reportAI.loading?D.muted:"#fff", cursor:reportAI.loading?"not-allowed":"pointer",
                  display:"flex", alignItems:"center", gap:9, transition:"all 0.2s",
                }}>
                  {reportAI.loading?<><Spinner size={14}/>Generating report…</>:"Generate Report"}
                </button>
              </div>
              {reportAI.text && (
                <div className="fade-in" style={{ background:D.void, border:`1px solid ${D.ridge}`,
                  borderRadius:10, padding:"18px 20px",
                  fontFamily:"'Space Mono', monospace", fontSize:11.5, color:D.ghost,
                  lineHeight:1.9, whiteSpace:"pre-wrap" }}>
                  {reportAI.text}
                </div>
              )}
              {!reportAI.text && !reportAI.loading && (
                <div style={{ textAlign:"center", padding:"40px 0" }}>
                  <div style={{ fontSize:32, marginBottom:12, opacity:0.3 }}>📋</div>
                  <Mono size={12} color={D.wire}>Select a scenario above, then press Generate Report</Mono>
                  <div style={{ fontSize:12, color:D.dim, marginTop:8 }}>
                    Report includes executive summary, sensor table, compound risk analysis, regulatory compliance, corrective actions
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
