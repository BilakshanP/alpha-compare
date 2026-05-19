import { useState, useEffect } from "react";
import type { CameraIndex, CameraData, Spec, SpecsMetaMap, NotesMap, Rule, CurrenciesMap, PppMap } from "./types";

import cameraIndex from "./data/cameras.json";
import specsMeta from "./data/specs-meta.json";
import sharedNotes from "./data/notes.json";
import currenciesData from "./data/currencies.json";
import pppData from "./data/ppp.json";
import a7vData from "./data/cameras/a7v.json";
import a7rviData from "./data/cameras/a7rvi.json";
import a1iiData from "./data/cameras/a1ii.json";
import a9iiiData from "./data/cameras/a9iii.json";

const CAMERAS = cameraIndex as CameraIndex[];
const SPECS_META = specsMeta as SpecsMetaMap;
const NOTES = sharedNotes as NotesMap;
const CURRENCIES = currenciesData as CurrenciesMap;
const PPP = pppData as PppMap;
const CAMERA_DATA: Record<string, CameraData> = {
  a7v: a7vData as CameraData,
  a7rvi: a7rviData as CameraData,
  a1ii: a1iiData as CameraData,
  a9iii: a9iiiData as CameraData,
};

// ─── Colour tokens ───────────────────────────────────────────────────────────
const C = { bg: "#080810", surface: "#0f0f18", border: "#1c1c2e", text: "#e4e4f0" };

// ─── Currency helpers ────────────────────────────────────────────────────────
function formatPrice(amount: number, currency: string): string {
  const cfg = CURRENCIES[currency];
  const symbol = cfg?.symbol || currency + " ";
  const formatted = amount.toLocaleString("en-IN", { maximumFractionDigits: 0 });
  return `${symbol}${formatted}`;
}

function useLiveRate(currency: string) {
  const [rate, setRate] = useState<number | null>(null);
  useEffect(() => {
    if (currency === "USD") { setRate(1); return; }
    setRate(null);
    fetch(`https://api.frankfurter.dev/v1/latest?base=USD&symbols=${currency}`)
      .then(r => r.json())
      .then(d => { if (d.rates?.[currency]) setRate(d.rates[currency]); })
      .catch(() => {});
  }, [currency]);
  return rate;
}

function getPrice(camId: string, currency: string, liveRate: number | null, usePpp: boolean): { fixed: number | null; converted: number | null; ppp: number | null } {
  const data = CAMERA_DATA[camId];
  if (!data) return { fixed: null, converted: null, ppp: null };

  const usd = data.price["USD"];
  const fixed = data.price[currency] ?? null;

  const converted = (usd != null && liveRate != null) ? Math.round(usd * liveRate) : null;
  const ppp = (usd != null && PPP[currency]) ? Math.round(usd * PPP[currency]) : null;

  if (usePpp) return { fixed: null, converted: null, ppp };
  return { fixed, converted: fixed != null ? converted : converted, ppp: null };
}

// ─── Winner computation ──────────────────────────────────────────────────────
function computeWinners(label: string, specs: Map<string, Spec>): string[] {
  const meta = SPECS_META[label];
  if (!meta) return [];
  const rule: Rule = meta.rule;
  if (rule === "tie") return [...specs.keys()];
  if (rule === "manual") return [];

  const entries: [string, number][] = [];
  for (const [camId, spec] of specs) {
    if (spec.value != null) entries.push([camId, spec.value]);
  }
  if (entries.length === 0) return [];

  const best = rule === "higher"
    ? Math.max(...entries.map(e => e[1]))
    : Math.min(...entries.map(e => e[1]));

  return entries.filter(e => e[1] === best).map(e => e[0]);
}

// ─── Join sections from selected cameras ─────────────────────────────────────
function joinSections(selectedIds: string[]) {
  const sectionOrder: string[] = [];
  const sectionLabels: Record<string, string> = {};
  const sectionSpecs: Record<string, string[]> = {};

  for (const id of selectedIds) {
    const data = CAMERA_DATA[id];
    if (!data) continue;
    for (const sec of data.sections) {
      if (!sectionOrder.includes(sec.id)) {
        sectionOrder.push(sec.id);
        sectionLabels[sec.id] = sec.label;
        sectionSpecs[sec.id] = [];
      }
      for (const spec of sec.specs) {
        if (!sectionSpecs[sec.id].includes(spec.label)) {
          sectionSpecs[sec.id].push(spec.label);
        }
      }
    }
  }

  return sectionOrder.map(secId => ({
    id: secId,
    label: sectionLabels[secId],
    specLabels: sectionSpecs[secId],
  }));
}

function getSpec(camId: string, sectionId: string, specLabel: string): Spec | null {
  const data = CAMERA_DATA[camId];
  if (!data) return null;
  const sec = data.sections.find(s => s.id === sectionId);
  if (!sec) return null;
  return sec.specs.find(s => s.label === specLabel) || null;
}

function getDisplayValue(spec: Spec | null): string {
  if (!spec) return "—";
  if (spec.display) return spec.display;
  if (spec.value != null && spec.unit) return `${spec.value} ${spec.unit}`;
  if (spec.value != null) return String(spec.value);
  return "—";
}

// ─── Score computation ───────────────────────────────────────────────────────
function computeScores(selectedIds: string[]) {
  const scores: Record<string, number> = Object.fromEntries(selectedIds.map(id => [id, 0]));
  const sections = joinSections(selectedIds);

  for (const sec of sections) {
    for (const specLabel of sec.specLabels) {
      const specMap = new Map<string, Spec>();
      for (const camId of selectedIds) {
        const spec = getSpec(camId, sec.id, specLabel);
        if (spec) specMap.set(camId, spec);
      }
      const winners = computeWinners(specLabel, specMap);
      for (const w of winners) {
        if (scores[w] !== undefined) scores[w]++;
      }
    }
  }
  return scores;
}

// ─── Components ──────────────────────────────────────────────────────────────
function CamHeader({ cam }: { cam: CameraIndex }) {
  const src = CAMERA_DATA[cam.id]?.src;
  return (
    <a href={src} target="_blank" rel="noopener noreferrer" style={{ textAlign: "center", padding: "0.4rem 0.25rem", textDecoration: "none", cursor: "pointer" }}>
      <div style={{ fontSize: "0.85rem", fontWeight: 700, color: cam.color, letterSpacing: "0.04em" }}>
        {cam.label}
      </div>
      <div style={{ fontSize: "0.55rem", color: "#666", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 1 }}>
        {cam.model}
      </div>
    </a>
  );
}

function ScoreBar({ selectedIds }: { selectedIds: string[] }) {
  const scores = computeScores(selectedIds);
  return (
    <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap", alignItems: "center" }}>
      {selectedIds.map(id => {
        const cam = CAMERAS.find(c => c.id === id)!;
        return (
          <div key={id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: cam.color }} />
            <span style={{ fontSize: "0.72rem", color: "#888" }}>{cam.label}</span>
            <span style={{ fontSize: "1rem", fontWeight: 700, color: cam.color }}>{scores[id]}</span>
          </div>
        );
      })}
    </div>
  );
}

function SpecRow({ specLabel, sectionId, selectedIds, even }: { specLabel: string; sectionId: string; selectedIds: string[]; even: boolean }) {
  const [open, setOpen] = useState(false);

  const specMap = new Map<string, Spec>();
  for (const camId of selectedIds) {
    const spec = getSpec(camId, sectionId, specLabel);
    if (spec) specMap.set(camId, spec);
  }

  const winners = computeWinners(specLabel, specMap);
  const sharedNote = NOTES[specLabel];
  const camNotes = [...specMap.values()].map(s => s.note).filter(Boolean);
  const hasNote = !!sharedNote || camNotes.length > 0;

  const cols = `1.6fr ${"1fr ".repeat(selectedIds.length).trim()}`;

  return (
    <div style={{ background: even ? "transparent" : "#0c0c16", borderBottom: "1px solid #161628" }}>
      <div
        style={{ display: "grid", gridTemplateColumns: cols, padding: "0.5rem 0.6rem", gap: "0.4rem", alignItems: "start", cursor: hasNote ? "pointer" : "default" }}
        onClick={() => hasNote && setOpen(o => !o)}
      >
        <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
          {hasNote && (
            <span style={{ color: "#555", fontSize: "0.65rem", marginTop: 2, flexShrink: 0, userSelect: "none" }}>
              {open ? "▼" : "▶"}
            </span>
          )}
          <span style={{ fontSize: "0.78rem", color: "#ccd", lineHeight: 1.35 }}>{specLabel}</span>
        </div>
        {selectedIds.map(camId => {
          const spec = specMap.get(camId);
          const val = getDisplayValue(spec || null);
          const cam = CAMERAS.find(c => c.id === camId)!;
          const win = winners.includes(camId);
          const isExclusive = val.startsWith("★");
          return (
            <div key={camId} style={{
              fontSize: "0.72rem",
              color: win ? cam.color : "#606075",
              fontWeight: win ? 600 : 400,
              lineHeight: 1.4,
              whiteSpace: "pre-line",
              background: isExclusive ? `${cam.color}15` : "transparent",
              borderRadius: 3,
              padding: isExclusive ? "2px 4px" : 0,
            }}>
              {val}{win && !isExclusive && <span style={{ marginLeft: 4, opacity: 0.6, fontSize: "0.55rem" }}>▲</span>}
            </div>
          );
        })}
      </div>
      {open && hasNote && (
        <div style={{ padding: "0.3rem 0.6rem 0.5rem 2rem", fontSize: "0.7rem", color: "#777", fontStyle: "italic", lineHeight: 1.5 }}>
          {sharedNote && <div>{sharedNote}</div>}
          {camNotes.map((n, i) => <div key={i}>{n}</div>)}
        </div>
      )}
    </div>
  );
}

function Tab({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: "none", border: "none",
      borderBottom: active ? "2px solid #f9a825" : "2px solid transparent",
      color: active ? "#f9a825" : "#444",
      padding: "0.65rem 0.7rem",
      fontSize: "0.6rem", letterSpacing: "0.08em", textTransform: "uppercase",
      cursor: "pointer", whiteSpace: "nowrap", transition: "color 0.15s",
    }}>
      {label}
    </button>
  );
}

// ─── Main App ────────────────────────────────────────────────────────────────
export default function App() {
  const [selectedIds, setSelectedIds] = useState<string[]>(CAMERAS.map(c => c.id));
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [currency, setCurrency] = useState("INR");
  const [usePpp, setUsePpp] = useState(false);
  const liveRate = useLiveRate(currency);

  const sections = joinSections(selectedIds);
  const visible = activeSection ? sections.filter(s => s.id === activeSection) : sections;
  const cols = `1.6fr ${"1fr ".repeat(selectedIds.length).trim()}`;

  function toggleCamera(id: string) {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: "'Courier New', monospace", color: C.text }}>
      {/* header */}
      <div style={{ padding: "2rem 1.25rem 1.25rem", borderBottom: "1px solid #1a1a2e" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontSize: "0.6rem", letterSpacing: "0.25em", color: "#444", textTransform: "uppercase", marginBottom: "1rem" }}>
            Sony Alpha Full-Frame E-Mount · Specifications Comparison
          </div>

          {/* camera picker */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
            {CAMERAS.map(cam => {
              const selected = selectedIds.includes(cam.id);
              return (
                <button key={cam.id} onClick={() => toggleCamera(cam.id)} style={{
                  background: selected ? `${cam.color}20` : "transparent",
                  border: `1px solid ${selected ? cam.color : "#333"}`,
                  color: selected ? cam.color : "#555",
                  padding: "0.4rem 0.75rem",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontSize: "0.75rem",
                  fontWeight: selected ? 600 : 400,
                  transition: "all 0.15s",
                }}>
                  {cam.label}
                </button>
              );
            })}
          </div>

          <ScoreBar selectedIds={selectedIds} />

          <div style={{ marginTop: "0.75rem", fontSize: "0.65rem", color: "#444", fontStyle: "italic" }}>
            ★ = exclusive feature · † = third-party tested · ▶ rows are expandable
          </div>
        </div>
      </div>

      {/* section filter */}
      <div style={{ borderBottom: "1px solid #1a1a2e" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", flexWrap: "wrap", padding: "0 1rem", gap: "0.25rem" }}>
          <Tab label="All" active={!activeSection} onClick={() => setActiveSection(null)} />
          {sections.map(s => (
            <Tab key={s.id} label={s.label} active={activeSection === s.id} onClick={() => setActiveSection(activeSection === s.id ? null : s.id)} />
          ))}
        </div>
      </div>

      {/* table */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 1rem 3rem" }}>
        {/* sticky header */}
        <div style={{ display: "grid", gridTemplateColumns: cols, padding: "0 0.6rem", position: "sticky", top: 0, background: C.bg, borderBottom: "1px solid #1a1a2e", zIndex: 10 }}>
          <div style={{ fontSize: "0.6rem", color: "#444", padding: "0.6rem 0", letterSpacing: "0.12em", textTransform: "uppercase" }}>Specification</div>
          {selectedIds.map(id => {
            const cam = CAMERAS.find(c => c.id === id)!;
            return <CamHeader key={id} cam={cam} />;
          })}
        </div>

        {/* price row */}
        <div style={{ display: "grid", gridTemplateColumns: cols, padding: "0.5rem 0.6rem", gap: "0.4rem", alignItems: "center", borderBottom: "1px solid #161628", background: "#0c0c16" }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
            <select value={currency} onChange={e => setCurrency(e.target.value)} style={{
              background: "#111", border: "1px solid #333", color: "#ccc", padding: "0.25rem 0.4rem",
              borderRadius: 3, fontSize: "0.65rem", cursor: "pointer",
            }}>
              {Object.entries(CURRENCIES).filter(([k]) => k !== "USD").map(([code, cfg]) => (
                <option key={code} value={code}>{cfg.symbol} {cfg.label}</option>
              ))}
            </select>
            <label style={{ display: "flex", alignItems: "center", gap: 3, fontSize: "0.6rem", color: "#555", cursor: "pointer" }}>
              <input type="checkbox" checked={usePpp} onChange={e => setUsePpp(e.target.checked)} style={{ accentColor: "#f9a825", width: 10, height: 10 }} />
              PPP (affordability)
            </label>
          </div>
          {selectedIds.map(id => {
            const cam = CAMERAS.find(c => c.id === id)!;
            const usdPrice = CAMERA_DATA[id]?.price["USD"];
            const { fixed, converted, ppp } = getPrice(id, currency, liveRate, usePpp);
            return (
              <div key={id} style={{ fontSize: "0.72rem", lineHeight: 1.5 }}>
                <div style={{ color: cam.color, fontWeight: 600 }}>
                  {usdPrice != null ? formatPrice(usdPrice, "USD") : "TBA"}
                </div>
                {ppp != null ? (
                  <div style={{ color: "#888" }}>
                    {formatPrice(ppp, currency)}
                    <span style={{ fontSize: "0.55rem", color: "#555", marginLeft: 4 }}>PPP equiv.</span>
                  </div>
                ) : (
                  <>
                    {fixed != null && (
                      <div style={{ color: "#888" }}>
                        {formatPrice(fixed, currency)}
                        <span style={{ fontSize: "0.55rem", color: "#555", marginLeft: 4 }}>fixed</span>
                      </div>
                    )}
                    {converted != null && (
                      <div style={{ color: "#666" }}>
                        {formatPrice(converted, currency)}
                        <span style={{ fontSize: "0.55rem", color: "#555", marginLeft: 4 }}>live</span>
                      </div>
                    )}
                    {fixed != null && converted != null && (() => {
                      const diff = fixed - converted;
                      const pct = ((diff / converted) * 100).toFixed(1);
                      const sign = diff > 0 ? "+" : "";
                      const color = diff > 0 ? "#ef5350" : "#66bb6a";
                      return (
                        <div style={{ fontSize: "0.55rem", color, marginTop: 1 }}>
                          {sign}{pct}% ({sign}{formatPrice(Math.abs(diff), currency)})
                        </div>
                      );
                    })()}
                    {fixed == null && converted == null && <div style={{ color: "#555" }}>TBA</div>}
                  </>
                )}
              </div>
            );
          })}
        </div>

        {visible.map(sec => (
          <div key={sec.id}>
            <div style={{ padding: "1rem 0.6rem 0.3rem", fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "#f9a825", fontFamily: "monospace" }}>
              ── {sec.label}
            </div>
            {sec.specLabels.map((label, i) => (
              <SpecRow key={label} specLabel={label} sectionId={sec.id} selectedIds={selectedIds} even={i % 2 === 0} />
            ))}
          </div>
        ))}

        {/* pros & cons */}
        <div style={{ margin: "2rem 0 0", display: "grid", gridTemplateColumns: `repeat(${selectedIds.length}, 1fr)`, gap: "1rem" }}>
          {selectedIds.map(id => {
            const cam = CAMERAS.find(c => c.id === id)!;
            const data = CAMERA_DATA[id];
            if (!data) return null;
            return (
              <div key={id} style={{ padding: "1rem", background: "#0d0d18", border: `1px solid ${cam.color}30`, borderTop: `2px solid ${cam.color}` }}>
                <div style={{ fontSize: "0.65rem", color: cam.color, fontWeight: 700, letterSpacing: "0.1em", marginBottom: "0.5rem" }}>
                  {cam.label} — PROS
                </div>
                {data.pros.map((p, i) => (
                  <div key={i} style={{ display: "flex", gap: 6, marginBottom: "0.3rem", fontSize: "0.7rem", color: "#777", lineHeight: 1.4 }}>
                    <span style={{ color: cam.color, flexShrink: 0 }}>+</span>{p}
                  </div>
                ))}
                <div style={{ fontSize: "0.65rem", color: "#666", fontWeight: 700, letterSpacing: "0.1em", margin: "0.75rem 0 0.5rem" }}>
                  CONS
                </div>
                {data.cons.map((c, i) => (
                  <div key={i} style={{ display: "flex", gap: 6, marginBottom: "0.3rem", fontSize: "0.7rem", color: "#555", lineHeight: 1.4 }}>
                    <span style={{ color: "#666", flexShrink: 0 }}>−</span>{c}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
