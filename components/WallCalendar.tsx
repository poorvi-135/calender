"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/* ─── types ──────────────────────────────────────────────── */
type Note = {
  id: string; type: "month"|"range"; text: string;
  monthKey: string; rangeStart?: string; rangeEnd?: string; createdAt: string;
};
type DayCell = { date: Date; inCurrentMonth: boolean };
type Season = "winter" | "spring" | "summer" | "autumn";

/* ─── WEATHER per month ───────────────────────────────────
   0=Jan … 11=Dec
   Each entry drives the entire hero panel look + particles
──────────────────────────────────────────────────────────── */
type WeatherConfig = {
  id: string;
  label: string;           // weather name shown in hero
  icon: string;            // big emoji shown
  accent: string;
  accentRgb: string;
  paperTint: string;
  skyGrad: string;         // hero background gradient
  particle: "snow"|"rain"|"sakura"|"sun"|"storm"|"leaf"|"firefly"|"none";
  particleCount: number;
  tempRange: string;       // e.g. "8–14°C"
  humidity: string;
  wind: string;
  desc: string;            // short weather description
};

const WEATHER: WeatherConfig[] = [
  // Jan – cold winter
  { id:"winter",   label:"Cold Winter",   icon:"❄️",  accent:"#4a9eff", accentRgb:"74,158,255",  paperTint:"#eef6ff",
    skyGrad:"linear-gradient(180deg,#0a1a3a 0%,#1a3060 45%,#2a5090 100%)",
    particle:"snow",    particleCount:55, tempRange:"5–12°C",  humidity:"72%", wind:"18 km/h", desc:"Cold & overcast with snowfall" },
  // Feb – chilly
  { id:"chilly",   label:"Chilly",        icon:"🌨️", accent:"#60aaff", accentRgb:"96,170,255",  paperTint:"#eef6ff",
    skyGrad:"linear-gradient(180deg,#0f2040 0%,#1e3a6a 50%,#3060a0 100%)",
    particle:"snow",    particleCount:30, tempRange:"8–16°C",  humidity:"68%", wind:"15 km/h", desc:"Occasional light snow showers" },
  // Mar – cherry blossom / spring
  { id:"spring",   label:"Spring Bloom",  icon:"🌸",  accent:"#ff6eb4", accentRgb:"255,110,180", paperTint:"#fff0f7",
    skyGrad:"linear-gradient(180deg,#1a0a28 0%,#6b2060 45%,#ff8abf 100%)",
    particle:"sakura", particleCount:40, tempRange:"18–26°C", humidity:"60%", wind:"12 km/h", desc:"Cherry blossoms in full bloom" },
  // Apr – mild sunny
  { id:"mild",     label:"Mild & Sunny",  icon:"⛅",  accent:"#ffb830", accentRgb:"255,184,48",  paperTint:"#fffbee",
    skyGrad:"linear-gradient(180deg,#0a1830 0%,#1e3060 40%,#4090d0 75%,#70c0f0 100%)",
    particle:"sun",     particleCount:8,  tempRange:"22–30°C", humidity:"55%", wind:"10 km/h", desc:"Warm sunny day with light breeze" },
  // May – hot sunny
  { id:"sunny",    label:"Sunny & Hot",   icon:"☀️",  accent:"#ff9500", accentRgb:"255,149,0",   paperTint:"#fff8ee",
    skyGrad:"linear-gradient(180deg,#050d20 0%,#102040 35%,#1060a0 70%,#40a0e0 100%)",
    particle:"sun",     particleCount:12, tempRange:"28–36°C", humidity:"48%", wind:"8 km/h",  desc:"Blazing sun, stay hydrated" },
  // Jun – pre-monsoon / stormy
  { id:"storm",    label:"Pre-Monsoon",   icon:"⛈️",  accent:"#7050d0", accentRgb:"112,80,208",  paperTint:"#f5f0ff",
    skyGrad:"linear-gradient(180deg,#05080f 0%,#0f1a30 40%,#202840 80%,#303848 100%)",
    particle:"storm",   particleCount:70, tempRange:"28–34°C", humidity:"82%", wind:"30 km/h", desc:"Thunderstorms approaching" },
  // Jul – monsoon / heavy rain
  { id:"monsoon",  label:"Monsoon",       icon:"🌧️",  accent:"#2080d0", accentRgb:"32,128,208",  paperTint:"#eef8ff",
    skyGrad:"linear-gradient(180deg,#050a14 0%,#0a1828 45%,#162840 100%)",
    particle:"rain",    particleCount:90, tempRange:"24–30°C", humidity:"95%", wind:"25 km/h", desc:"Heavy monsoon rainfall" },
  // Aug – rainy
  { id:"rainy",    label:"Rainy Season",  icon:"🌦️",  accent:"#30a0e0", accentRgb:"48,160,224",  paperTint:"#eef8ff",
    skyGrad:"linear-gradient(180deg,#080e1a 0%,#101e38 45%,#203048 100%)",
    particle:"rain",    particleCount:65, tempRange:"24–29°C", humidity:"90%", wind:"20 km/h", desc:"Intermittent rain showers" },
  // Sep – clearing up
  { id:"clearing", label:"Clearing Up",   icon:"🌤️",  accent:"#20c090", accentRgb:"32,192,144",  paperTint:"#eefff8",
    skyGrad:"linear-gradient(180deg,#081820 0%,#103040 45%,#3080a0 80%,#60c0b0 100%)",
    particle:"none",    particleCount:0,  tempRange:"25–32°C", humidity:"75%", wind:"14 km/h", desc:"Rain clearing, sunshine returning" },
  // Oct – autumn / falling leaves
  { id:"autumn",   label:"Autumn",        icon:"🍂",  accent:"#e06020", accentRgb:"224,96,32",   paperTint:"#fff5ee",
    skyGrad:"linear-gradient(180deg,#100800 0%,#301808 45%,#804020 80%,#d06030 100%)",
    particle:"leaf",    particleCount:35, tempRange:"20–28°C", humidity:"58%", wind:"16 km/h", desc:"Crisp autumn air, leaves falling" },
  // Nov – cool / firefly
  { id:"cool",     label:"Cool Evenings", icon:"🌙",  accent:"#6060d0", accentRgb:"96,96,208",   paperTint:"#f5f0ff",
    skyGrad:"linear-gradient(180deg,#020410 0%,#080c28 45%,#101838 100%)",
    particle:"firefly", particleCount:25, tempRange:"14–22°C", humidity:"65%", wind:"12 km/h", desc:"Cool nights with fireflies" },
  // Dec – winter cold
  { id:"xmas",     label:"Winter Cold",   icon:"🎄",  accent:"#20c060", accentRgb:"32,192,96",   paperTint:"#eefff5",
    skyGrad:"linear-gradient(180deg,#020a08 0%,#051a10 45%,#0a3020 80%,#103828 100%)",
    particle:"snow",    particleCount:50, tempRange:"8–16°C",  humidity:"70%", wind:"14 km/h", desc:"Festive winter, light snowfall" },
];

const MONTHS   = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const WEEKDAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

const SEASON_BY_MONTH: Season[] = [
  "winter", // Jan
  "winter", // Feb
  "spring", // Mar
  "spring", // Apr
  "spring", // May
  "summer", // Jun
  "summer", // Jul
  "summer", // Aug
  "autumn", // Sep
  "autumn", // Oct
  "autumn", // Nov
  "winter", // Dec
];

const SEASON_VISUALS: Record<
  Season,
  {
    label: string;
    icon: string;
    desc: string;
    particle: WeatherConfig["particle"];
    particleCount: number;
    skyGrad: string;
    accent: string;
    accentRgb: string;
    paperTint: string;
  }
> = {
  winter: {
    label: "Winter Season",
    icon: "❄️",
    desc: "Cold weather with snowy atmosphere",
    particle: "snow",
    particleCount: 56,
    skyGrad: "linear-gradient(180deg,#0a1a3a 0%,#1a3060 45%,#2a5090 100%)",
    accent: "#4a9eff",
    accentRgb: "74,158,255",
    paperTint: "#eef6ff",
  },
  spring: {
    label: "Spring Season",
    icon: "🌸",
    desc: "Pleasant days with blooming vibes",
    particle: "sakura",
    particleCount: 68,
    skyGrad: "linear-gradient(180deg,#1a0a28 0%,#6b2060 45%,#ff8abf 100%)",
    accent: "#ff6eb4",
    accentRgb: "255,110,180",
    paperTint: "#fff0f7",
  },
  summer: {
    label: "Summer Season",
    icon: "☀️",
    desc: "Bright, warm and sunny days",
    particle: "sun",
    particleCount: 14,
    skyGrad: "linear-gradient(180deg,#3a1900 0%,#8a3d08 36%,#d9781f 68%,#f6b24a 100%)",
    accent: "#f0a91f",
    accentRgb: "240,169,31",
    paperTint: "#fff6df",
  },
  autumn: {
    label: "Autumn Season",
    icon: "🍂",
    desc: "Cool breeze with falling leaves",
    particle: "leaf",
    particleCount: 54,
    skyGrad: "linear-gradient(180deg,#100800 0%,#301808 45%,#804020 80%,#d06030 100%)",
    accent: "#e06020",
    accentRgb: "224,96,32",
    paperTint: "#fff5ee",
  },
};

const HOLIDAYS: Record<string,{label:string;emoji:string}> = {
  "01-01":{label:"New Year's Day",  emoji:"🎉"},
  "01-26":{label:"Republic Day",    emoji:"🇮🇳"},
  "02-14":{label:"Valentine's Day", emoji:"❤️"},
  "03-08":{label:"Women's Day",     emoji:"🌸"},
  "08-15":{label:"Independence Day",emoji:"🇮🇳"},
  "10-02":{label:"Gandhi Jayanti",  emoji:"🕊️"},
  "10-31":{label:"Halloween",       emoji:"🎃"},
  "12-25":{label:"Christmas",       emoji:"🎄"},
};

const STORAGE_KEY = "wall-cal-v3";

/* ─── helpers ────────────────────────────────────────────── */
const dk = (d:Date) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
const mk = (y:number,m:number) =>
  `${y}-${String(m+1).padStart(2,"0")}`;
const parsedk = (k:string) => { const [y,mo,d]=k.split("-").map(Number); return new Date(y,mo-1,d); };
const sameDay  = (a:Date,b:Date) =>
  a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate();
const fmtDate  = (d:Date) =>
  d.toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});
const inRange  = (d:Date,s:Date,e:Date) => { const lo=s<=e?s:e,hi=s<=e?e:s; return d>lo&&d<hi; };

function buildGrid(year:number,month:number):DayCell[] {
  const first=new Date(year,month,1), firstWd=(first.getDay()+6)%7;
  const dim=new Date(year,month+1,0).getDate(), dimPrev=new Date(year,month,0).getDate();
  const cells:DayCell[]=[];
  for(let i=firstWd-1;i>=0;i--) cells.push({date:new Date(year,month-1,dimPrev-i),inCurrentMonth:false});
  for(let d=1;d<=dim;d++) cells.push({date:new Date(year,month,d),inCurrentMonth:true});
  while(cells.length%7!==0) cells.push({date:new Date(year,month+1,cells.length-(firstWd+dim)+1),inCurrentMonth:false});
  return cells;
}

/* ─── particle seeds (stable per month/type) ──────────────── */
function makeParticles(w:WeatherConfig, month:number) {
  const seed = month * 997;
  if (w.particle === "snow") {
    return Array.from({ length: w.particleCount }, (_, i) => {
      const jitter = (((seed + i * 37) % 100) / 100 - 0.5) * 2.2; // small x jitter only
      return {
        id: i,
        x: ((i + 0.5) / w.particleCount) * 100 + jitter,
        delay: ((seed + i * 19) % 100) / 28,
        dur: 3.2 + (((seed + i * 13) % 100) / 100) * 2.2,
        size: 4.5 + (((seed + i * 11) % 100) / 100) * 6.5,
        opacity: 0.55 + (((seed + i * 29) % 100) / 100) * 0.4,
        swing: 0,
        startY: -(((seed + i * 23) % 100) / 100) * 280,
      };
    });
  }
  if (w.particle === "sakura") {
    return Array.from({ length: w.particleCount }, (_, i) => {
      const jitter = (((seed + i * 41) % 100) / 100 - 0.5) * 2.8;
      return {
        id: i,
        x: ((i + 0.5) / w.particleCount) * 100 + jitter,
        delay: ((seed + i * 17) % 100) / 20,
        dur: 2.4 + (((seed + i * 23) % 100) / 100) * 2.6,
        size: 4.8 + (((seed + i * 13) % 100) / 100) * 8.4,
        opacity: 0.55 + (((seed + i * 29) % 100) / 100) * 0.4,
        swing: (((seed + i * 31) % 100) / 100) * 34 - 17,
        startY: -(((seed + i * 37) % 100) / 100) * 300,
      };
    });
  }
  if (w.particle === "leaf") {
    return Array.from({ length: w.particleCount }, (_, i) => {
      const jitter = (((seed + i * 43) % 100) / 100 - 0.5) * 3.2;
      return {
        id: i,
        x: ((i + 0.5) / w.particleCount) * 100 + jitter,
        delay: ((seed + i * 19) % 100) / 20,
        dur: 2.8 + (((seed + i * 27) % 100) / 100) * 2.8,
        size: 5.5 + (((seed + i * 11) % 100) / 100) * 8.2,
        opacity: 0.5 + (((seed + i * 33) % 100) / 100) * 0.45,
        swing: (((seed + i * 29) % 100) / 100) * 32 - 16,
        startY: -(((seed + i * 41) % 100) / 100) * 320,
      };
    });
  }
  return Array.from({length:w.particleCount},(_,i)=>{
    const r = (n:number) => ((seed*i*31+n*17)%100)/100;
    return {
      id:i,
      x: r(1)*100,
      delay: r(2)*4,
      dur: 1.5 + r(3)*3.5,
      size: 4 + r(4)*10,
      opacity: 0.5 + r(5)*0.5,
      swing: r(6)*60 - 30,
      startY: -20 + r(7)*(-60),
    };
  });
}

/* ══════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════ */
export default function WallCalendar() {
  const now = useMemo(()=>new Date(),[]);
  const [viewYear,  setViewYear]  = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [rangeStart, setRangeStart] = useState<Date|null>(null);
  const [rangeEnd,   setRangeEnd]   = useState<Date|null>(null);
  const [draft,    setDraft]      = useState("");
  const [notes,    setNotes]      = useState<Note[]>([]);
  const [flipping, setFlipping]   = useState(false);
  const [flipDir,  setFlipDir]    = useState<"next"|"prev">("next");
  const [tooltip,  setTooltip]    = useState<{text:string;x:number;y:number}|null>(null);
  const [hovDay,   setHovDay]     = useState<string|null>(null);
  const [confetti, setConfetti]   = useState<{id:number;x:number;color:string;delay:number;size:number;rot:number}[]>([]);
  const calRef = useRef<HTMLDivElement>(null);

  const weather  = WEATHER[viewMonth];
  const season = SEASON_BY_MONTH[viewMonth];
  const seasonVisual = SEASON_VISUALS[season];
  const weatherFx = useMemo(
    ()=>({ ...weather, particle: seasonVisual.particle, particleCount: seasonVisual.particleCount, skyGrad: seasonVisual.skyGrad }),
    [weather, seasonVisual],
  );
  const particleSeed = season==="winter" ? 11 : viewMonth;
  const particles = useMemo(()=>makeParticles(weatherFx,particleSeed),[weatherFx,particleSeed]);
  const grid     = useMemo(()=>buildGrid(viewYear,viewMonth),[viewYear,viewMonth]);
  const curMk    = mk(viewYear,viewMonth);
  const showMoon = false;
  const showSun = season==="summer";

  const ordered = useMemo(()=>{
    if(!rangeStart||!rangeEnd) return null;
    return rangeStart<=rangeEnd?{start:rangeStart,end:rangeEnd}:{start:rangeEnd,end:rangeStart};
  },[rangeStart,rangeEnd]);
  const effectiveRange = useMemo(()=>{
    if (ordered) return ordered;
    if (rangeStart && !rangeEnd) return { start: rangeStart, end: rangeStart };
    return null;
  },[ordered, rangeStart, rangeEnd]);

  const noteDates = useMemo(()=>{
    const s=new Set<string>();
    notes.forEach(n=>{
      if(n.type!=="range"||!n.rangeStart||!n.rangeEnd) return;
      let c=parsedk(n.rangeStart); const e=parsedk(n.rangeEnd);
      while(c<=e){s.add(dk(c));c=new Date(c.getFullYear(),c.getMonth(),c.getDate()+1);}
    });
    return s;
  },[notes]);

  const visibleNotes = useMemo(()=>{
    const monthStart = `${curMk}-01`;
    const monthEnd = dk(new Date(viewYear, viewMonth + 1, 0));
    return notes
      .filter((n) => {
        if (n.type === "month") return n.monthKey === curMk;
        if (n.type === "range" && n.rangeStart && n.rangeEnd) {
          return n.rangeStart <= monthEnd && n.rangeEnd >= monthStart;
        }
        return false;
      })
      .sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
  },[curMk,notes,viewYear,viewMonth]);
  const monthHolidays = useMemo(()=>{
    return grid
      .filter((cell)=>cell.inCurrentMonth)
      .map((cell)=>{
        const iso = dk(cell.date);
        const holiday = HOLIDAYS[iso.slice(5)];
        if(!holiday) return null;
        return { iso, date: cell.date, ...holiday };
      })
      .filter((item): item is { iso:string; date:Date; label:string; emoji:string } => item !== null);
  },[grid]);

  const totalDays = effectiveRange?Math.floor((effectiveRange.end.getTime()-effectiveRange.start.getTime())/86400000)+1:0;

  useEffect(()=>{ try{const r=localStorage.getItem(STORAGE_KEY);if(r)setNotes(JSON.parse(r));}catch{} },[]);
  useEffect(()=>{ localStorage.setItem(STORAGE_KEY,JSON.stringify(notes)); },[notes]);

  useEffect(()=>{
    const p=Array.from({length:22},(_,i)=>({
      id:i,x:Math.random()*100,
      color:["#ff4820","#ffd166","#06d6a0","#118ab2","#9b5de5","#ff9f1c"][Math.floor(Math.random()*6)],
      delay:Math.random()*1.8,size:5+Math.random()*9,rot:Math.random()*360,
    }));
    setConfetti(p);
    const t=setTimeout(()=>setConfetti([]),5000);
    return ()=>clearTimeout(t);
  },[]);

  function goMonth(dir:number) {
    if(flipping) return;
    setFlipDir(dir>0?"next":"prev");
    setFlipping(true);
    setTimeout(()=>{
      const d=new Date(viewYear,viewMonth+dir,1);
      setViewYear(d.getFullYear()); setViewMonth(d.getMonth());
      setFlipping(false);
    },480);
  }

  function handleDay(date:Date) {
    if(rangeStart&&rangeEnd){setRangeStart(date);setRangeEnd(null);return;}
    if(!rangeStart){setRangeStart(date);return;}
    if(sameDay(rangeStart,date)){setRangeStart(null);setRangeEnd(null);return;}
    setRangeEnd(date);
  }

  function handleDayEnter(date:Date,e:React.MouseEvent) {
    const iso=dk(date); setHovDay(iso);
    const hol=HOLIDAYS[iso.slice(5)];
    if(hol){
      const r=(e.currentTarget as HTMLElement).getBoundingClientRect();
      const cr=calRef.current?.getBoundingClientRect();
      if(cr) setTooltip({text:`${hol.emoji} ${hol.label}`,x:r.left-cr.left+r.width/2,y:r.top-cr.top-8});
    } else setTooltip(null);
  }

  function quickRange(days:number) {
    const s=new Date(now.getFullYear(),now.getMonth(),now.getDate());
    const e=new Date(s.getFullYear(),s.getMonth(),s.getDate()+days-1);
    setRangeStart(s);setRangeEnd(e);setViewYear(s.getFullYear());setViewMonth(s.getMonth());
  }

  function saveNote() {
    const t=draft.trim(); if(!t) return;
    const n:Note={
      id:crypto.randomUUID(),
      type: effectiveRange ? "range" : "month",
      text:t,
      monthKey:curMk,
      createdAt:new Date().toISOString(),
    };
    if(effectiveRange){n.rangeStart=dk(effectiveRange.start);n.rangeEnd=dk(effectiveRange.end);}
    setNotes(p=>[n,...p]); setDraft("");
  }

  const isCurrentMonth = viewYear===now.getFullYear()&&viewMonth===now.getMonth();

  /* ── particle renderers ─────────────────────────────────── */
  function renderParticle(p:ReturnType<typeof makeParticles>[0], type:WeatherConfig["particle"]) {
    const base: React.CSSProperties = {
      position:"absolute", left:`${p.x}%`, top:`${p.startY}px`,
      animationDelay:`${p.delay}s`, animationDuration:`${p.dur}s`,
      opacity: p.opacity, pointerEvents:"none",
    };

    if(type==="snow") return (
      <div
        key={p.id}
        className="ptcl ptcl-snowball"
        style={{
          ...base,
          width: p.size * 0.6,
          height: p.size * 0.6,
          animationDuration: `${p.dur + 1.2}s`,
        }}
      />
    );
    if(type==="rain") return (
      <div key={p.id} className="ptcl ptcl-rain" style={{...base,
        width:1.8,height:p.size*2.5,
        background:`linear-gradient(180deg, rgba(210,235,255,0) 0%, rgba(170,210,255,${p.opacity*.55}) 38%, rgba(130,190,255,${p.opacity}) 100%)`,
        borderRadius:2,
        animationDuration:`${0.95 + p.dur*.75}s`,
      }}/>
    );
    if(type==="sakura") return (
      <div key={p.id} className="ptcl ptcl-sakura" style={{...base,fontSize:p.size*.85}}
      >🌸</div>
    );
    if(type==="sun") return (
      <div key={p.id} className="ptcl ptcl-sun" style={{
        position:"absolute",
        left:`${10+p.x*.8}%`, top:`${10+p.id*6}%`,
        width:p.size+8, height:p.size+8,
        borderRadius:"50%",
        background:`radial-gradient(circle,rgba(255,230,100,${p.opacity*.6}),transparent 70%)`,
        animationDelay:`${p.delay}s`,
        animationDuration:`${3+p.dur}s`,
        pointerEvents:"none",
      }}/>
    );
    if(type==="storm") return (
      <div key={p.id} className="ptcl ptcl-rain ptcl-rain-storm" style={{...base,
        width:2.1,height:p.size*3,
        background:`linear-gradient(180deg, rgba(225,235,255,0) 0%, rgba(205,220,255,${p.opacity*.45}) 26%, rgba(185,210,255,${p.opacity*.9}) 100%)`,
        borderRadius:1,
        animationDuration:`${0.42 + p.dur*.42}s`,
      }}/>
    );
    if(type==="leaf") return (
      <div key={p.id} className="ptcl ptcl-leaf" style={{...base,fontSize:p.size*.9}}>
        {["🍂","🍁","🍃"][p.id%3]}
      </div>
    );
    if(type==="firefly") return (
      <div key={p.id} className="ptcl ptcl-firefly" style={{
        position:"absolute",
        left:`${p.x}%`, top:`${20+p.id*3}%`,
        width:p.size*.4, height:p.size*.4,
        borderRadius:"50%",
        background:`radial-gradient(circle,rgba(220,255,120,${p.opacity}),transparent 70%)`,
        boxShadow:`0 0 ${p.size}px rgba(180,255,80,.8)`,
        animationDelay:`${p.delay}s`,
        animationDuration:`${2+p.dur}s`,
        pointerEvents:"none",
      }}/>
    );
    return null;
  }

  return (
    <div
      className="wc-root"
      style={{
        "--accent": seasonVisual.accent,
        "--accent-rgb": seasonVisual.accentRgb,
        "--paper-tint": seasonVisual.paperTint,
        "--hero-title": season==="summer" ? "#ffeab6" : "#ffffff",
        "--hero-year": season==="summer" ? "#ffe3a0" : "#ffffff",
      } as React.CSSProperties}
      ref={calRef}
    >
      {/* confetti */}
      {confetti.map(c=>(
        <div key={c.id} className="confetti-piece"
          style={{left:`${c.x}%`,background:c.color,width:c.size,height:c.size,
            animationDelay:`${c.delay}s`,transform:`rotate(${c.rot}deg)`}}/>
      ))}

      {/* tooltip */}
      {tooltip&&(
        <div className="hol-tip" style={{left:tooltip.x,top:tooltip.y}}>{tooltip.text}</div>
      )}

      {/* ══ RINGS ══ */}
      <div className="rings" aria-hidden="true">
        {Array.from({length:16}).map((_,i)=>(
          <div key={i} className="ring"><div className="ring-inner"/></div>
        ))}
      </div>

      {/* ══ SHEET ══ */}
      <div className="sheet">

        {/* ── HERO WEATHER PANEL ── */}
        <div className="hero-panel" style={{background:weatherFx.skyGrad}}>

          {/* weather particles */}
          <div className="particles-layer" aria-hidden="true">
            {particles.map(p=>renderParticle(p, weatherFx.particle))}
          </div>

          {/* lightning flash for storm */}
          {weatherFx.particle==="storm"&&(
            <div className="lightning-wrap" aria-hidden="true">
              <div className="lightning l1"/>
              <div className="lightning l2"/>
            </div>
          )}

          {/* moon for winter/cool months */}
          {showMoon&&(
            <div className="moon" aria-hidden="true"/>
          )}

          {/* sun only for sunny months */}
          {showSun&&(
            <div className="hero-sun" aria-hidden="true"/>
          )}

          {/* mountain silhouettes */}
          <div className="mtn mtn-4"/><div className="mtn mtn-3"/>
          <div className="mtn mtn-2"/><div className="mtn mtn-1"/>

          {/* weather info card */}
          <div className="weather-card">
            <div className={`weather-icon-wrap${flipping?" flip-"+flipDir:""}`}>
              <span className="weather-icon">{seasonVisual.icon}</span>
            </div>
            <div className="weather-stats">
              <span className="weather-label">{seasonVisual.label}</span>
              <span className="weather-desc">{seasonVisual.desc}</span>
            </div>
          </div>

          {/* month + year overlay */}
          <div className="hero-title-block">
            <div className={`month-flip-wrap${flipping?" flip-"+flipDir:""}`}>
              <h1 className="hero-month">{MONTHS[viewMonth]}</h1>
            </div>
            <p className="hero-year">{viewYear}</p>
          </div>

          {/* nav + month quick jump */}
          <div className="hero-bottom-row">
            <div className="nav-btns">
              <button className="nav-btn" onClick={()=>goMonth(-1)} disabled={flipping} aria-label="Prev month">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <button className="nav-today"
                onClick={()=>{setViewYear(now.getFullYear());setViewMonth(now.getMonth());}}>
                TODAY
              </button>
              <button className="nav-btn" onClick={()=>goMonth(1)} disabled={flipping} aria-label="Next month">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>

            {/* month emoji quick picker */}
            <div className="month-emoji-row">
              {WEATHER.map((w,i)=>(
                <button key={w.id}
                  className={`mep-btn${i===viewMonth?" mep-active":""}`}
                  onClick={()=>setViewMonth(i)}
                  title={MONTHS[i]}>
                  {w.icon}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── BODY ── */}
        <div className="sheet-body">

          {/* ── CALENDAR PANEL ── */}
          <section className="cal-panel">

            {/* range bar */}
            <div className={`range-bar${effectiveRange?" active":rangeStart?" picking":""}`}>
              {effectiveRange?(
                <>
                  <span className="rb-text">📅 {fmtDate(effectiveRange.start)}{sameDay(effectiveRange.start, effectiveRange.end) ? "" : ` → ${fmtDate(effectiveRange.end)}`}</span>
                  <span className="rb-badge">{totalDays} days</span>
                  <button className="rb-x" onClick={()=>{setRangeStart(null);setRangeEnd(null);}}>✕</button>
                </>
              ):rangeStart?(
                <span className="rb-text">📍 {fmtDate(rangeStart)} — pick end date</span>
              ):(
                <span className="rb-hint">Tap any date to start a range selection</span>
              )}
            </div>

            {/* weekdays */}
            <div className="week-row">
              {WEEKDAYS.map(w=>(
                <div key={w} className={`wday${w==="Sat"||w==="Sun"?" wknd":""}`}>{w}</div>
              ))}
            </div>

            {/* days grid */}
            <div
              className={`days-grid${flipping?" flip flip-"+flipDir:""}`}
              onMouseLeave={()=>{setHovDay(null);setTooltip(null);}}
            >
              {grid.map((cell,idx)=>{
                const iso=dk(cell.date), mmdd=iso.slice(5);
                const isToday=sameDay(cell.date,now);
                const isWknd=cell.date.getDay()===0||cell.date.getDay()===6;
                const isS=rangeStart?sameDay(cell.date,rangeStart):false;
                const isE=rangeEnd?sameDay(cell.date,rangeEnd):false;
                const isMid=ordered?inRange(cell.date,ordered.start,ordered.end):false;
                const hol=HOLIDAYS[mmdd], hasNote=noteDates.has(iso);
                return (
                  <button key={iso}
                    className={["day",cell.inCurrentMonth?"":"adj",isToday?"today":"",
                      isWknd&&cell.inCurrentMonth?"wknd":"",isS?"rng-s":"",isE?"rng-e":"",
                      isMid?"rng-m":"",hasNote?"has-note":"",hol?"has-hol":"",hovDay===iso?"hov":"",
                    ].filter(Boolean).join(" ")}
                    style={{"--i":idx} as React.CSSProperties}
                    onClick={()=>handleDay(cell.date)}
                    onMouseEnter={e=>handleDayEnter(cell.date,e)}
                    aria-label={`${fmtDate(cell.date)}${isToday?" (Today)":""}${hol?` — ${hol.label}`:""}`}
                  >
                    <span className="dn">{cell.date.getDate()}</span>
                    {hol&&<span className="hol-emoji">{hol.emoji}</span>}
                    {hasNote&&<span className="note-pip"/>}
                    {isToday&&<span className="today-pulse"/>}
                  </button>
                );
              })}
            </div>

            {/* quick select */}
            <div className="quick-row">
              <span className="ql">Quick:</span>
              {[{l:"Today",d:1},{l:"7 Days",d:7},{l:"14 Days",d:14},{l:"30 Days",d:30}].map(q=>(
                <button key={q.l} className="qbtn" onClick={()=>quickRange(q.d)}>{q.l}</button>
              ))}
            </div>

            <div className="special-days">
              <p className="special-days-title">Special Days</p>
              {monthHolidays.length===0 ? (
                <p className="special-days-empty">No special days in this month.</p>
              ) : (
                <div className="special-days-list">
                  {monthHolidays.map((holiday)=>(
                    <div key={holiday.iso} className="special-day-item">
                      <span className="special-day-icon">{holiday.emoji}</span>
                      <span className="special-day-text">
                        <span className="special-day-name">{holiday.label}</span>
                        <span className="special-day-date-full">{holiday.date.getDate()} {MONTHS[viewMonth]}</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* ── NOTES PANEL ── */}
          <aside className="notes-panel">
            <div className="np-head">
              <h2>Notes</h2>
              <span className="np-cnt">{notes.length} total</span>
            </div>
            <p className="np-ctx">
              {effectiveRange
                ? sameDay(effectiveRange.start, effectiveRange.end)
                  ? `Writing for ${fmtDate(effectiveRange.start)}`
                  : `Writing for ${fmtDate(effectiveRange.start)} → ${fmtDate(effectiveRange.end)}`
                : `Writing for ${MONTHS[viewMonth]} ${viewYear}`}
            </p>
            <textarea className="np-ta" value={draft}
              onChange={e=>setDraft(e.target.value)}
              onKeyDown={e=>{if(e.key==="Enter"&&(e.ctrlKey||e.metaKey))saveNote();}}
              placeholder={effectiveRange
                ? sameDay(effectiveRange.start, effectiveRange.end)
                  ? "Write a note for this date…\n(Ctrl+Enter saves)"
                  : "Write a note for this range…\n(Ctrl+Enter saves)"
                : "Write a memo for this month…"}
            />
            <button className="save-btn" onClick={saveNote}>
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                <polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
              </svg>
              Save Note
            </button>
            <div className="notes-list">
              {visibleNotes.length===0
                ?<p className="np-empty">No notes yet ✨</p>
                :visibleNotes.map(n=>(
                  <article key={n.id} className="note-card" onClick={()=>setDraft(n.text)}>
                    <div className="nc-row">
                      <span className="nc-key">
                        {n.type==="range"&&n.rangeStart
                          ? (n.rangeStart===n.rangeEnd ? n.rangeStart : `${n.rangeStart}→${n.rangeEnd}`)
                          : n.monthKey}
                      </span>
                      <button className="nc-del" onClick={e=>{e.stopPropagation();setNotes(p=>p.filter(x=>x.id!==n.id));}} aria-label="Delete">✕</button>
                    </div>
                    <p className="nc-body">{n.text}</p>
                  </article>
                ))
              }
            </div>
          </aside>
        </div>

        {/* footer */}
        <footer className="cal-footer">
          <span>{seasonVisual.icon} {seasonVisual.label}</span>
          {isCurrentMonth&&<span className="ft-today">Today is {fmtDate(now)}</span>}
          <span className="ft-hint">Click to select · Ctrl+Enter saves</span>
        </footer>
      </div>
    </div>
  );
}
