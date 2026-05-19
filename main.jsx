import { useState } from "react";

// ─── Colour tokens ───────────────────────────────────────────────────────────
const C = {
  bg:      "#080810",
  surface: "#0f0f18",
  border:  "#1c1c2e",
  text:    "#e4e4f0",
  muted:   "#6060808",
  a7v:   { col: "#4fc3f7", label: "α7 V"   },
  a7rvi: { col: "#f48fb1", label: "α7R VI" },
  a1ii:  { col: "#a5d6a7", label: "α1 II"  },
  a9iii: { col: "#ffcc80", label: "α9 III" },
};
const CAMS = ["a7v", "a7rvi", "a1ii", "a9iii"];
const CAM_LABELS = { a7v:"α7 V", a7rvi:"α7R VI", a1ii:"α1 II", a9iii:"α9 III" };
const CAM_COLOR  = { a7v:C.a7v.col, a7rvi:C.a7rvi.col, a1ii:C.a1ii.col, a9iii:C.a9iii.col };
const CAM_SUB    = { a7v:"ILCE-7M5", a7rvi:"ILCE-7RM6", a1ii:"ILCE-1M2", a9iii:"ILCE-9M3" };
const CAM_PRICE  = { a7v:"₹2,70,990", a7rvi:"Coming soon", a1ii:"₹5,99,990", a9iii:"—" };

// note codes:  "★" = exclusive to this camera  "†" = third-party sourced
// winner: array of cam keys, or "all" | "tie"
const SECTIONS = [
  {
    id:"sensor", label:"Sensor & Resolution",
    rows:[
      { label:"Sensor architecture",
        note:"Fully stacked = fastest e-readout. Partially stacked = fast but not global.",
        vals:{
          a7v:   "Partially stacked\nExmor RS CMOS",
          a7rvi: "Fully stacked\nExmor RS CMOS",
          a1ii:  "Fully stacked\nExmor RS CMOS",
          a9iii: "Fully stacked\nExmor RS CMOS\n★ Global shutter",
        },
        winner:["a9iii"],
      },
      { label:"Effective pixels (still)",
        vals:{ a7v:"33.0 MP", a7rvi:"66.8 MP", a1ii:"50.1 MP", a9iii:"24.6 MP" },
        winner:["a7rvi"],
      },
      { label:"Effective pixels (movie)",
        vals:{ a7v:"27.6 MP", a7rvi:"55.8 MP", a1ii:"42.0 MP", a9iii:"20.3 MP" },
        winner:["a7rvi"],
      },
      { label:"Sensor size",
        vals:{ a7v:"35.9×23.9 mm", a7rvi:"35.9×24.0 mm", a1ii:"35.9×24.0 mm", a9iii:"35.6×23.8 mm" },
        winner:["tie"],
      },
      { label:"Optical low-pass filter",
        vals:{ a7v:"Yes", a7rvi:"Not listed", a1ii:"Not listed", a9iii:"Yes" },
        winner:["tie"],
      },
      { label:"RAW format",
        note:"ARW 6.0 adds Compressed (HQ); ARW 5.0 older format.",
        vals:{ a7v:"ARW 6.0", a7rvi:"ARW 6.0", a1ii:"ARW 5.0", a9iii:"ARW 5.0" },
        winner:["a7v","a7rvi"],
      },
      { label:"Dynamic range (max)",
        vals:{ a7v:"~16 stops", a7rvi:"~16 stops", a1ii:"~15 stops", a9iii:"~14.3 stops †" },
        winner:["a7v","a7rvi"],
        note:"† CineD lab. a9III global shutter trades DR for zero rolling shutter.",
      },
    ]
  },
  {
    id:"readout", label:"⚡ Readout Speed & Rolling Shutter",
    rows:[
      { label:"Stills readout (approx.) †",
        note:"† Third-party lab tests (CineD / PetaPixel). Sony doesn't publish ms figures.",
        vals:{
          a7v:   "~14 ms\n(partially stacked)",
          a7rvi: "~18 ms\n(fully stacked, high-res penalty)",
          a1ii:  "<4 ms\n(fully stacked, high speed)",
          a9iii: "0 ms\n★ Global shutter — zero rolling shutter",
        },
        winner:["a9iii"],
      },
      { label:"4K video readout (approx.) †",
        note:"CineD lab. a7R VI 4K DG-OFF ≈7ms; DG-ON ≈15.6ms.",
        vals:{
          a7v:   "~14.5 ms",
          a7rvi: "~7–8 ms (DG off)\n~15.6 ms (Dual Gain on)",
          a1ii:  "<4 ms",
          a9iii: "0 ms",
        },
        winner:["a9iii"],
      },
      { label:"8K video readout (approx.) †",
        vals:{
          a7v:   "N/A (no 8K)",
          a7rvi: "~17 ms\n(vs ~100ms on a7R V — massive improvement)",
          a1ii:  "<4 ms",
          a9iii: "N/A (no 8K)",
        },
        winner:["a1ii"],
      },
      { label:"Max electronic shutter speed",
        note:"Faster = less motion blur in flash-sync scenarios. Global shutter unlocks full 1/80,000s.",
        vals:{
          a7v:   "1/16,000 s",
          a7rvi: "1/8,000 s",
          a1ii:  "1/32,000 s",
          a9iii: "★ 1/80,000 s",
        },
        winner:["a9iii"],
      },
      { label:"Does 30fps mean same readout?",
        note:"No. Burst fps = how often frames are delivered. Readout ms = how fast the sensor scans each frame. You can deliver 30fps with 18ms readout or 4ms readout — rolling shutter only depends on readout speed.",
        vals:{
          a7v:   "30fps e-shutter\nbut ~14ms readout",
          a7rvi: "30fps e-shutter\nbut ~18ms readout",
          a1ii:  "30fps e-shutter\n<4ms readout",
          a9iii: "★120fps e-shutter\n0ms readout",
        },
        winner:["a9iii"],
      },
      { label:"Blackout-free burst",
        vals:{
          a7v:   "Yes — 30fps",
          a7rvi: "Yes — 30fps",
          a1ii:  "Yes — 30fps",
          a9iii: "★ Yes — 120fps",
        },
        winner:["a9iii"],
      },
      { label:"AF/AE calculations / sec",
        note:"More calcs = AF tracks faster-moving subjects more reliably during bursts.",
        vals:{
          a7v:   "60 / sec",
          a7rvi: "60 / sec",
          a1ii:  "★ 120 / sec",
          a9iii: "Not specified\n(global shutter pipeline differs)",
        },
        winner:["a1ii"],
      },
    ]
  },
  {
    id:"iso", label:"ISO & Low-Light",
    rows:[
      { label:"Native ISO range (still)",
        vals:{
          a7v:   "100–51,200",
          a7rvi: "100–32,000",
          a1ii:  "100–32,000",
          a9iii: "★ min ISO 250\n(global shutter penalty)\n250–25,600",
        },
        winner:["a7v"],
        note:"a9III's global shutter requires higher base ISO — a design trade-off.",
      },
      { label:"Expanded ISO (still)",
        vals:{
          a7v:   "★ 50–204,800",
          a7rvi: "50–102,400",
          a1ii:  "50–102,400",
          a9iii: "125–51,200",
        },
        winner:["a7v"],
      },
      { label:"Native ISO range (movie)",
        vals:{
          a7v:   "100–51,200",
          a7rvi: "100–32,000",
          a1ii:  "100–32,000",
          a9iii: "250–25,600",
        },
        winner:["a7v"],
      },
    ]
  },
  {
    id:"af", label:"Autofocus",
    rows:[
      { label:"AF system",
        vals:{a7v:"Fast Hybrid AF\n(phase+contrast)",a7rvi:"Fast Hybrid AF\n(phase+contrast)",a1ii:"Fast Hybrid AF\n(phase+contrast)",a9iii:"Fast Hybrid AF\n(phase+contrast)"},
        winner:["tie"],
      },
      { label:"Phase-detect points (still / movie)",
        note:"a9III has fewer movie AF points — a quirk of its global shutter architecture.",
        vals:{
          a7v:   "759 / 759",
          a7rvi: "759 / 759",
          a1ii:  "759 / 759",
          a9iii: "759 still / 627 movie",
        },
        winner:["a7v","a7rvi","a1ii"],
      },
      { label:"AF sensitivity range",
        note:"a7R VI's EV–6 (and –11 in Bright Monitoring) requires F1.2 lens; a9III's EV–5 is with F2.0.",
        vals:{
          a7v:   "EV–4 to EV20\n(F2.0 lens)",
          a7rvi: "EV–6 to EV20 (F1.2)\nEV–11 (Bright Monitoring)",
          a1ii:  "EV–4 to EV20\n(F2.0 lens)",
          a9iii: "EV–5 to EV20\n(F2.0 lens)",
        },
        winner:["a7rvi"],
      },
      { label:"Metering sensitivity",
        vals:{
          a7v:   "EV–3 to EV20",
          a7rvi: "EV–5 to EV20",
          a1ii:  "EV–3 to EV20",
          a9iii: "EV–5 to EV17",
        },
        winner:["a7rvi"],
      },
      { label:"AF tracking response modes",
        note:"a1II uniquely offers Stable/Standard/Responsive tracking response for stills.",
        vals:{
          a7v:   "Standard",
          a7rvi: "Standard",
          a1ii:  "★ Stable / Standard / Responsive",
          a9iii: "Standard",
        },
        winner:["a1ii"],
      },
      { label:"★ Selectable release time lag",
        note:"Exclusive to a1 II — lets you trade first-frame blackout for shortest possible lag.",
        vals:{
          a7v:   "—",
          a7rvi: "—",
          a1ii:  "★ Yes (Fastest/Stable/Auto)",
          a9iii: "—",
        },
        winner:["a1ii"],
      },
    ]
  },
  {
    id:"drive", label:"Drive & Burst",
    rows:[
      { label:"Max continuous speed (e-shutter)",
        vals:{a7v:"30fps",a7rvi:"30fps",a1ii:"30fps",a9iii:"★120fps"},
        winner:["a9iii"],
      },
      { label:"Max continuous speed (mech.)",
        vals:{a7v:"10fps",a7rvi:"10fps",a1ii:"10fps",a9iii:"N/A — electronic only"},
        winner:["a7v","a7rvi","a1ii"],
        note:"a9III has no mechanical shutter at all.",
      },
      { label:"Buffer — JPEG Fine L",
        vals:{a7v:"185",a7rvi:"215",a1ii:"400 (@ 20fps)\n190 (30fps, extra fine)",a9iii:"Not specified"},
        winner:["a1ii"],
      },
      { label:"Buffer — RAW compressed",
        vals:{a7v:"35",a7rvi:"65",a1ii:"153 (compressed)\n240 (compressed, 30fps)",a9iii:"Not specified"},
        winner:["a1ii"],
      },
      { label:"Flash sync speed",
        note:"Higher sync = more ambient light control in flash work. a9III's global shutter enables full-speed sync at any shutter speed (1/80,000s).",
        vals:{
          a7v:   "1/250s (FF)\n1/320s (APS-C)",
          a7rvi: "1/250s (FF)\n1/320s (APS-C)",
          a1ii:  "★ 1/400s (FF)\n1/500s (APS-C)",
          a9iii: "★★ 1/80,000s\n(any speed — global shutter)",
        },
        winner:["a9iii"],
      },
      { label:"Pixel Shift Multi Shooting",
        vals:{a7v:"—",a7rvi:"★ Yes (4 / 16 shots)",a1ii:"★ Yes (4 / 16 shots)",a9iii:"—"},
        winner:["a7rvi","a1ii"],
      },
    ]
  },
  {
    id:"ibis", label:"Image Stabilisation",
    rows:[
      { label:"IBIS centre (stops)",
        vals:{a7v:"7.5",a7rvi:"8.5",a1ii:"8.5",a9iii:"8.0"},
        winner:["a7rvi","a1ii"],
      },
      { label:"IBIS periphery (stops)",
        vals:{a7v:"6.5",a7rvi:"7.0",a1ii:"7.0",a9iii:"Not specified"},
        winner:["a7rvi","a1ii"],
      },
    ]
  },
  {
    id:"video", label:"Video Recording",
    rows:[
      { label:"Max video resolution",
        vals:{a7v:"4K 120p",a7rvi:"★ 8K 30p / 4K 120p",a1ii:"★ 8K 30p / 4K 120p",a9iii:"4K 120p"},
        winner:["a7rvi","a1ii"],
      },
      { label:"RAW video output (HDMI)",
        vals:{a7v:"—",a7rvi:"Yes (16-bit)",a1ii:"Yes (16-bit)",a9iii:"Yes (16-bit)"},
        winner:["a7rvi","a1ii","a9iii"],
      },
      { label:"Max audio quality",
        note:"a7R VI adds 96kHz/32-bit float (with XLR-A4 adaptor) — professional broadcast standard.",
        vals:{
          a7v:   "48kHz 24-bit LPCM",
          a7rvi: "★ 96kHz 32-bit float\n(with XLR-A4 adaptor)",
          a1ii:  "48kHz 24-bit LPCM",
          a9iii: "48kHz 24-bit LPCM",
        },
        winner:["a7rvi"],
      },
      { label:"Network streaming",
        note:"RTMP/RTMPS/SRT live-streaming built in — no capture card needed.",
        vals:{
          a7v:   "—",
          a7rvi: "★ Yes (RTMP/RTMPS/SRT)\nUp to 4K 30p",
          a1ii:  "★ Yes (RTMP/RTMPS/SRT)\nUp to 4K 30p",
          a9iii: "—",
        },
        winner:["a7rvi","a1ii"],
      },
      { label:"Dual Gain mode",
        vals:{a7v:"—",a7rvi:"★ Yes",a1ii:"—",a9iii:"—"},
        winner:["a7rvi"],
      },
    ]
  },
  {
    id:"evf", label:"Viewfinder & Display",
    rows:[
      { label:"EVF type & size",
        vals:{a7v:"0.5\" Quad-VGA OLED",a7rvi:"0.64\" Quad-XGA OLED\nDCI-P3, 10-bit",a1ii:"0.64\" Quad-XGA OLED",a9iii:"0.64\" Quad-XGA OLED"},
        winner:["a7rvi","a1ii","a9iii"],
      },
      { label:"EVF resolution",
        vals:{a7v:"3,686,400 dots",a7rvi:"9,437,184 dots",a1ii:"9,437,184 dots",a9iii:"9,437,184 dots"},
        winner:["a7rvi","a1ii","a9iii"],
      },
      { label:"EVF magnification",
        vals:{a7v:"0.78×",a7rvi:"0.90×",a1ii:"0.90×",a9iii:"0.90×"},
        winner:["a7rvi","a1ii","a9iii"],
      },
      { label:"Max EVF frame rate",
        note:"240fps EVF (exclusive to a1 II and a9 III) eliminates perceived lag for fast sports.",
        vals:{
          a7v:   "120fps",
          a7rvi: "120fps",
          a1ii:  "★ 240fps",
          a9iii: "★ 240fps",
        },
        winner:["a1ii","a9iii"],
      },
      { label:"LCD resolution / type",
        vals:{a7v:"2,095,104 dots TFT\n4-axis tilt",a7rvi:"2,095,104 dots TFT\n4-axis tilt, DCI-P3",a1ii:"2,095,104 dots TFT\n4-axis tilt",a9iii:"2,095,104 dots TFT\n4-axis tilt"},
        winner:["a7rvi"],
      },
      { label:"★ Illuminated rear buttons",
        vals:{a7v:"—",a7rvi:"★ Yes",a1ii:"—",a9iii:"—"},
        winner:["a7rvi"],
      },
    ]
  },
  {
    id:"connectivity", label:"Connectivity & Storage",
    rows:[
      { label:"Card slots (CFexpress A support)",
        vals:{
          a7v:   "Slot 1 only\n(Slot 2 = SD only)",
          a7rvi: "★ Both slots",
          a1ii:  "★ Both slots",
          a9iii: "★ Both slots",
        },
        winner:["a7rvi","a1ii","a9iii"],
      },
      { label:"Wired LAN",
        note:"a1 II has fastest LAN (2.5Gbps) — purpose-built for pro news/sports transmission.",
        vals:{
          a7v:   "Via USB-C adapter only",
          a7rvi: "Via USB-C adapter only",
          a1ii:  "★ Built-in 2.5GBASE-T\n(2.5 Gbps native)",
          a9iii: "Built-in 1000BASE-T\n(1 Gbps)",
        },
        winner:["a1ii"],
      },
      { label:"Wi-Fi standard",
        vals:{
          a7v:   "Wi-Fi 6 (802.11ax)\n2.4/5/6 GHz",
          a7rvi: "Wi-Fi 6 (802.11ax)\n2.4/5/6 GHz",
          a1ii:  "Wi-Fi 5 (802.11ac)\n2.4/5 GHz only",
          a9iii: "Wi-Fi 5 (802.11ac)\n2.4/5 GHz only",
        },
        winner:["a7v","a7rvi"],
        note:"a1 II and a9 III use older Wi-Fi 5; a7V/a7R VI get Wi-Fi 6 with 6 GHz band.",
      },
      { label:"Bluetooth",
        vals:{a7v:"BT 5.3",a7rvi:"BT 5.3",a1ii:"BT 5.0",a9iii:"BT 5.0"},
        winner:["a7v","a7rvi"],
      },
      { label:"Sync terminal",
        vals:{a7v:"—",a7rvi:"★ Yes",a1ii:"★ Yes",a9iii:"★ Yes"},
        winner:["a7rvi","a1ii","a9iii"],
      },
      { label:"Multi/Micro USB port",
        vals:{a7v:"—",a7rvi:"—",a1ii:"★ Yes (legacy)",a9iii:"★ Yes (legacy)"},
        winner:["tie"],
        note:"Useful for older accessories; a7V/a7R VI dropped it.",
      },
      { label:"Voice memo microphone",
        note:"Useful for editors — photographer narrates shot context during burst.",
        vals:{a7v:"—",a7rvi:"—",a1ii:"★ Yes",a9iii:"★ Yes"},
        winner:["a1ii","a9iii"],
      },
      { label:"★ IPTC metadata embedding",
        vals:{a7v:"—",a7rvi:"—",a1ii:"★ Yes (up to 20 presets)",a9iii:"—"},
        winner:["a1ii"],
      },
    ]
  },
  {
    id:"power", label:"Power & Battery",
    rows:[
      { label:"Battery model",
        note:"a7R VI uses new NP-SA100 (2670mAh). a9III ships with BC-QZ1 charger.",
        vals:{a7v:"NP-FZ100",a7rvi:"NP-SA100 (new)",a1ii:"NP-FZ100",a9iii:"NP-FZ100"},
        winner:["a7rvi"],
      },
      { label:"Battery life — stills (EVF / LCD)",
        vals:{a7v:"630 / 750",a7rvi:"600 / 710",a1ii:"420 / 520",a9iii:"400 / 530"},
        winner:["a7v"],
      },
      { label:"Battery life — movie actual rec.",
        vals:{a7v:"130 min",a7rvi:"135 min",a1ii:"85 min",a9iii:"90 min"},
        winner:["a7rvi"],
      },
      { label:"Power draw — stills (EVF)",
        vals:{a7v:"~3.1 W",a7rvi:"~4.2 W",a1ii:"~4.7 W",a9iii:"~4.8 W (LCD)"},
        winner:["a7v"],
      },
    ]
  },
  {
    id:"body", label:"Body & Build",
    rows:[
      { label:"Weight incl. battery (g)",
        vals:{a7v:"695",a7rvi:"713",a1ii:"743",a9iii:"702"},
        winner:["a7v"],
      },
      { label:"Body only weight (g)",
        vals:{a7v:"610",a7rvi:"622",a1ii:"658",a9iii:"617"},
        winner:["a7v"],
      },
      { label:"Dimensions W×H×D (mm)",
        vals:{a7v:"130.3×96.4×82.4",a7rvi:"132.7×96.9×82.9",a1ii:"136.1×96.9×82.9",a9iii:"136.1×96.9×82.9"},
        winner:["a7v"],
      },
      { label:"C5 custom button (front)",
        vals:{a7v:"—",a7rvi:"—",a1ii:"★ Yes",a9iii:"★ Yes"},
        winner:["a1ii","a9iii"],
      },
      { label:"Charger in box",
        vals:{a7v:"—\n(USB-C charge only)",a7rvi:"★ BC-SAD1\n(dual-slot, fast)",a1ii:"★ BC-ZD1\n(dual, 155 min)",a9iii:"BC-QZ1 included"},
        winner:["a7rvi","a1ii"],
      },
      { label:"India price",
        vals:{a7v:"₹2,70,990",a7rvi:"Coming soon",a1ii:"₹5,99,990",a9iii:"~₹4,49,990 †"},
        winner:["a7v"],
      },
    ]
  },
];

// ── helpers ──────────────────────────────────────────────────────────────────
function isWinner(camKey, winners) {
  if (!winners || winners.length === 0) return false;
  if (winners[0] === "tie" || winners[0] === "all") return true;
  return winners.includes(camKey);
}

// ── components ───────────────────────────────────────────────────────────────
function CamHeader({ id }) {
  return (
    <div style={{ textAlign:"center", padding:"0.4rem 0.25rem" }}>
      <div style={{ fontSize:"0.85rem", fontWeight:700, color:CAM_COLOR[id], letterSpacing:"0.04em" }}>
        {CAM_LABELS[id]}
      </div>
      <div style={{ fontSize:"0.55rem", color:"#666", letterSpacing:"0.1em", textTransform:"uppercase", marginTop:1 }}>
        {CAM_SUB[id]}
      </div>
    </div>
  );
}

function ScoreBar() {
  const counts = Object.fromEntries(CAMS.map(k=>[k,0]));
  SECTIONS.forEach(sec=>sec.rows.forEach(row=>{
    if (!row.winner || row.winner[0]==="tie") return;
    if (row.winner[0]==="all") { CAMS.forEach(k=>counts[k]++); return; }
    row.winner.forEach(k=>{ if(counts[k]!==undefined) counts[k]++; });
  }));
  return (
    <div style={{ display:"flex", gap:"1.25rem", flexWrap:"wrap", alignItems:"center" }}>
      {CAMS.map(k=>(
        <div key={k} style={{ display:"flex", alignItems:"center", gap:6 }}>
          <div style={{ width:8,height:8,borderRadius:"50%",background:CAM_COLOR[k] }}/>
          <span style={{ fontSize:"0.72rem", color:"#888" }}>{CAM_LABELS[k]}</span>
          <span style={{ fontSize:"1rem", fontWeight:700, color:CAM_COLOR[k] }}>{counts[k]}</span>
        </div>
      ))}
    </div>
  );
}

function SpecRow({ row, even }) {
  const [open, setOpen] = useState(false);
  const hasNote = !!row.note;
  return (
    <div style={{ background: even ? "transparent" : "#0c0c16", borderBottom:`1px solid #161628` }}>
      <div style={{
        display:"grid",
        gridTemplateColumns:"1.6fr 1fr 1fr 1fr 1fr",
        padding:"0.5rem 0.6rem",
        gap:"0.4rem",
        alignItems:"start",
        cursor: hasNote ? "pointer" : "default",
      }}
        onClick={() => hasNote && setOpen(o=>!o)}
      >
        {/* label col */}
        <div style={{ display:"flex", gap:6, alignItems:"flex-start" }}>
          {hasNote && (
            <span style={{ color:"#555", fontSize:"0.65rem", marginTop:2, flexShrink:0, userSelect:"none" }}>
              {open ? "▼" : "▶"}
            </span>
          )}
          <span style={{ fontSize:"0.78rem", color:"#ccd", lineHeight:1.35 }}>
            {row.label}
          </span>
        </div>
        {/* cam cols */}
        {CAMS.map(k=>{
          const win = isWinner(k, row.winner);
          const val = row.vals[k] || "—";
          const isExclusive = val.startsWith("★");
          return (
            <div key={k} style={{
              fontSize:"0.72rem",
              color: win ? CAM_COLOR[k] : "#606075",
              fontWeight: win ? 600 : 400,
              lineHeight:1.4,
              whiteSpace:"pre-line",
              background: isExclusive ? `${CAM_COLOR[k]}15` : "transparent",
              borderRadius:3,
              padding: isExclusive ? "2px 4px" : 0,
            }}>
              {val}{win && !isExclusive && <span style={{ marginLeft:4, opacity:0.6, fontSize:"0.55rem" }}>▲</span>}
            </div>
          );
        })}
      </div>
      {open && hasNote && (
        <div style={{ padding:"0.3rem 0.6rem 0.5rem 2rem", fontSize:"0.7rem", color:"#777", fontStyle:"italic", lineHeight:1.5 }}>
          {row.note}
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [activeSection, setActiveSection] = useState(null);
  const visible = activeSection ? SECTIONS.filter(s=>s.id===activeSection) : SECTIONS;

  return (
    <div style={{ background:C.bg, minHeight:"100vh", fontFamily:"'Courier New', monospace", color:C.text }}>
      {/* header */}
      <div style={{ padding:"2rem 1.25rem 1.25rem", borderBottom:"1px solid #1a1a2e" }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <div style={{ fontSize:"0.6rem", letterSpacing:"0.25em", color:"#444", textTransform:"uppercase", marginBottom:"0.4rem" }}>
            Sony Alpha Full-Frame E-Mount · Full Specifications Analysis · 2026
          </div>
          <h1 style={{ fontSize:"clamp(1.2rem,4vw,2rem)", fontWeight:400, margin:0, display:"flex", flexWrap:"wrap", gap:"0.4rem 0.7rem", lineHeight:1.2 }}>
            {CAMS.map((k,i)=>(
              <span key={k}>
                <span style={{ color:CAM_COLOR[k] }}>{CAM_LABELS[k]}</span>
                {i<CAMS.length-1 && <span style={{ color:"#333", marginLeft:"0.7rem" }}>·</span>}
              </span>
            ))}
          </h1>
          <div style={{ marginTop:"1rem" }}>
            <ScoreBar/>
          </div>
          <div style={{ marginTop:"0.75rem", fontSize:"0.65rem", color:"#444", fontStyle:"italic" }}>
            ★ = spec exclusive to that camera  ·  † = third-party tested (CineD / PetaPixel)  ·  ▶ rows are expandable for context
          </div>
        </div>
      </div>

      {/* section filter */}
      <div style={{ borderBottom:"1px solid #1a1a2e", overflowX:"auto" }}>
        <div style={{ maxWidth:1100, margin:"0 auto", display:"flex", padding:"0 1rem" }}>
          <Tab label="All" active={!activeSection} onClick={()=>setActiveSection(null)} />
          {SECTIONS.map(s=>(
            <Tab key={s.id} label={s.label.replace(/^⚡ /,"")} active={activeSection===s.id} onClick={()=>setActiveSection(activeSection===s.id?null:s.id)} />
          ))}
        </div>
      </div>

      {/* table */}
      <div style={{ maxWidth:1100, margin:"0 auto", padding:"0 1rem 3rem" }}>
        {/* sticky header */}
        <div style={{ display:"grid", gridTemplateColumns:"1.6fr 1fr 1fr 1fr 1fr", padding:"0 0.6rem", position:"sticky", top:0, background:C.bg, borderBottom:"1px solid #1a1a2e", zIndex:10 }}>
          <div style={{ fontSize:"0.6rem", color:"#444", padding:"0.6rem 0", letterSpacing:"0.12em", textTransform:"uppercase" }}>Specification</div>
          {CAMS.map(k=><CamHeader key={k} id={k} />)}
        </div>

        {visible.map(sec=>(
          <div key={sec.id}>
            <div style={{ padding:"1rem 0.6rem 0.3rem", fontSize:"0.6rem", letterSpacing:"0.2em", textTransform:"uppercase", color:"#f9a825", fontFamily:"monospace" }}>
              ── {sec.label}
            </div>
            {sec.rows.map((row,i)=><SpecRow key={row.label} row={row} even={i%2===0}/>)}
          </div>
        ))}

        {/* readout explainer box */}
        {(!activeSection || activeSection==="readout") && (
          <div style={{ margin:"2rem 0", padding:"1.25rem 1.5rem", background:"#0d0d1a", border:"1px solid #1e1e35", borderLeft:`3px solid #f9a825` }}>
            <div style={{ fontSize:"0.6rem", letterSpacing:"0.2em", color:"#f9a825", marginBottom:"0.6rem" }}>
              READOUT SPEED EXPLAINED
            </div>
            <div style={{ fontSize:"0.75rem", color:"#888", lineHeight:1.7 }}>
              <strong style={{color:"#aaa"}}>Why "30fps blackout-free" doesn't tell you about rolling shutter:</strong> Burst fps describes how many finished images are delivered per second. Readout speed (in ms) describes how fast the sensor scans through all its rows top-to-bottom for each frame. A camera can output 30 frames per second while each frame takes 18ms to read — fast-moving subjects will still appear skewed. The α9 III eliminates this with a global shutter (all rows captured simultaneously: 0ms rolling shutter). The α1 II comes close at &lt;4ms. The α7 V (~14ms) and α7R VI (~18ms stills, ~7ms in 4K) are dramatically better than their predecessors but still show visible skew on fast lateral motion with the e-shutter.
              <br/><br/>
              <strong style={{color:"#aaa"}}>Sources:</strong> Readout figures from CineD lab tests (independent measurement) and PetaPixel reviews. Sony does not publish readout speeds in their official specs.
            </div>
          </div>
        )}

        {/* verdict */}
        <div style={{ margin:"2rem 0 0", display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:"1rem" }}>
          {[
            { cam:"a7v",   points:["Best ISO range — low-light stills king","Lightest body, most affordable","Best battery life per charge","1/16,000s e-shutter (partially stacked advantage)","Familiar NP-FZ100 battery ecosystem"] },
            { cam:"a7rvi", points:["66.8 MP — highest resolution in lineup","Best 4K readout: ~7ms (DG off)","8K 30p video with 32-bit float audio","EVF with DCI-P3 and illuminated buttons","Dual Gain video, both slots CFexpress A"] },
            { cam:"a1ii",  points:["<4ms readout — near-global-shutter quality","120 AF/AE calcs/sec — fastest tracking","1/400s flash sync; 1/32,000s e-shutter","240fps EVF; 2.5Gbps wired LAN","IPTC metadata, voice memo, C5 button"] },
            { cam:"a9iii", points:["★ Zero rolling shutter — global shutter","1/80,000s e-shutter; 1/500s flash sync","120fps blackout-free burst","Purest motion capture — no skew ever","Only camera where e-shutter = mech. shutter quality"] },
          ].map(({cam,points})=>(
            <div key={cam} style={{ padding:"1rem", background:"#0d0d18", border:`1px solid ${CAM_COLOR[cam]}30`, borderTop:`2px solid ${CAM_COLOR[cam]}` }}>
              <div style={{ fontSize:"0.65rem", color:CAM_COLOR[cam], fontWeight:700, letterSpacing:"0.1em", marginBottom:"0.75rem" }}>
                CHOOSE {CAM_LABELS[cam]} IF…
              </div>
              {points.map((p,i)=>(
                <div key={i} style={{ display:"flex", gap:6, marginBottom:"0.35rem", fontSize:"0.7rem", color:"#777", lineHeight:1.4 }}>
                  <span style={{ color:CAM_COLOR[cam], flexShrink:0 }}>→</span>{p}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Tab({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      background:"none", border:"none",
      borderBottom: active ? "2px solid #f9a825" : "2px solid transparent",
      color: active ? "#f9a825" : "#444",
      padding:"0.65rem 0.7rem",
      fontSize:"0.6rem", letterSpacing:"0.08em", textTransform:"uppercase",
      cursor:"pointer", whiteSpace:"nowrap", transition:"color 0.15s",
    }}>
      {label}
    </button>
  );
}
