import { useState, useEffect } from "react";
import TrainerScreenComponent from "./TrainerScreen.jsx";
import HistoryScreen from "./HistoryScreen.jsx";
import ScorerScreen from "./ScorerScreen.jsx";
import { useTheme } from "./theme.js";

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 520);
  useEffect(() => {
    const handler = () => setIsDesktop(window.innerWidth > 520);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return isDesktop;
}

// ─── Navigation ────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: "trainer",  label: "Trainer",  subtitle: "Practice discards & scoring",    icon: "🎓" },
  { id: "scorer",   label: "Scorer",   subtitle: "Score any hand manually",         icon: "🃏" },
  { id: "history",  label: "History",  subtitle: "Past sessions & efficiency",      icon: "📋" },
  { id: "settings", label: "Settings", subtitle: "Rules variants & preferences",    icon: "⚙️" },
];

/**
 * @param {{ view: string, dropdownOpen: boolean, onToggleDropdown: () => void,
 *   onThemeToggle: () => void, isDesktop: boolean, isDark: boolean,
 *   t: import("./theme.js").Theme }} props
 */
function TopBar({ view, dropdownOpen, onToggleDropdown, onThemeToggle, isDesktop, isDark, t }) {
  const current = NAV_ITEMS.find(n => n.id === view);
  return (
    <div style={{
      display: "flex", alignItems: "center",
      paddingTop: isDesktop ? 18 : "calc(18px + env(safe-area-inset-top))",
      paddingBottom: 14, paddingLeft: 16, paddingRight: 16,
      background: t.feltBase,
    }}>
      <span style={{
        fontSize: 20, fontWeight: 800, color: t.textPrimary,
        fontFamily: t.fontUi,
        letterSpacing: "-0.02em", lineHeight: 1, flexShrink: 0,
      }}>121</span>

      <div style={{ width: 1, height: 18, background: t.feltRule, margin: "0 12px", flexShrink: 0 }} />

      <button
        onClick={onToggleDropdown}
        style={{
          display: "flex", alignItems: "center", gap: 5,
          background: t.feltMid, border: "none",
          borderRadius: t.radius.md, padding: "6px 10px",
          cursor: "pointer", flexShrink: 0,
          WebkitTapHighlightColor: "transparent",
        }}
      >
        <span style={{
          fontSize: 15, fontWeight: 700, color: t.textPrimary,
          fontFamily: t.fontUi, letterSpacing: "-0.01em",
        }}>{current?.label}</span>
        <span style={{
          fontSize: 10, color: t.textSecondary, lineHeight: 1,
          display: "inline-block",
          transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 200ms ease-out",
        }}>▾</span>
      </button>

      <div style={{ flex: 1 }} />

      <button
        onClick={onThemeToggle}
        style={{
          background: "none", border: "none", cursor: "pointer",
          color: t.textSecondary, fontSize: 18,
          minWidth: 44, minHeight: 44,
          WebkitTapHighlightColor: "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          lineHeight: 1,
        }}
        aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      >{isDark ? "☀" : "☾"}</button>
    </div>
  );
}

/**
 * @param {{ view: string, onNavigate: (id: string) => void, t: import("./theme.js").Theme }} props
 */
function SectionDropdown({ view, onNavigate, t }) {
  return (
    <div style={{ background: t.feltBase }}>
      {NAV_ITEMS.map((item, idx) => {
        const active = view === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            style={{
              display: "flex", alignItems: "center", gap: 14,
              width: "100%", padding: "14px 16px",
              background: active ? t.goldGlow : "transparent",
              border: "none",
              borderBottom: idx < NAV_ITEMS.length - 1 ? `1px solid ${t.feltRule}` : "none",
              cursor: "pointer", textAlign: "left",
              WebkitTapHighlightColor: "transparent",
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: t.feltMid,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 20,
            }}>{item.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 15, fontWeight: 700, lineHeight: 1.2,
                color: active ? t.goldBright : t.textPrimary,
                fontFamily: t.fontUi, letterSpacing: "-0.01em",
              }}>{item.label}</div>
              <div style={{ fontSize: 13, color: t.textSecondary, marginTop: 2, lineHeight: 1.3 }}>
                {item.subtitle}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}


/** @param {{ t: import("./theme.js").Theme }} props */
function SettingsScreen({ t }) {
  return (
    <div style={{
      flex: 1, display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: 32, gap: 10, background: t.feltBase,
    }}>
      <div style={{ fontSize: 40 }}>⚙️</div>
      <div style={{
        fontSize: 20, fontWeight: 800, color: t.textPrimary,
        fontFamily: t.fontUi, letterSpacing: "-0.01em",
      }}>Settings</div>
      <div style={{ fontSize: 13, color: t.textSecondary, textAlign: "center", maxWidth: 260, lineHeight: 1.5 }}>
        Rules variants and preferences coming soon.
      </div>
    </div>
  );
}

// ─── App ───────────────────────────────────────────────────────────────────

export default function CribbageCalculator() {
  const [t, toggleTheme, isDark] = useTheme();
  const isDesktop = useIsDesktop();
  const [view, setView] = useState("trainer");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div style={{
      height: isDesktop ? undefined : "100dvh",
      minHeight: isDesktop ? "100vh" : undefined,
      background: t.feltDeep,
      fontFamily: t.fontUi,
      display: "flex", flexDirection: "column",
      alignItems: "center",
      padding: isDesktop ? "48px 20px 64px" : 0,
    }}>
      <div style={{
        width: "100%", maxWidth: 480,
        display: "flex", flexDirection: "column",
        flex: isDesktop ? undefined : 1,
        minHeight: isDesktop ? "auto" : undefined,
        borderRadius: isDesktop ? 18 : 0,
        overflow: "hidden",
        boxShadow: isDesktop ? `0 8px 48px rgba(0,0,0,0.45), 0 1px 0 ${t.feltRule}` : "none",
        border: isDesktop ? `1px solid ${t.feltRule}` : "none",
        background: t.feltBase,
      }}>

        {/* TopBar */}
        <TopBar
          view={view}
          dropdownOpen={dropdownOpen}
          onToggleDropdown={() => setDropdownOpen(o => !o)}
          onThemeToggle={toggleTheme}
          isDesktop={isDesktop}
          isDark={isDark}
          t={t}
        />

        {/* Topbar rule — always visible, separates header from page content */}
        <div style={{ height: 1, background: t.feltRule, flexShrink: 0 }} />

        {/* Content area: flex 1, relative so dropdown can overlay it */}
        <div style={{
          flex: 1, position: "relative",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}>

          {/* Section dropdown overlay */}
          {dropdownOpen && (
            <>
              {/* Scrim — dims content, click to close */}
              <div
                onClick={() => setDropdownOpen(false)}
                style={{
                  position: "absolute", inset: 0,
                  background: "rgba(0,0,0,0.5)",
                  zIndex: 9,
                }}
              />
              {/* Dropdown panel */}
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0,
                zIndex: 10,
                background: t.feltBase,
                borderBottom: `1px solid ${t.feltRule}`,
              }}>
                <SectionDropdown
                  view={view}
                  onNavigate={(id) => { setView(id); setDropdownOpen(false); }}
                  t={t}
                />
              </div>
            </>
          )}

          {/* Page content */}
          {view === "trainer"  && <TrainerScreenComponent t={t} />}
          {view === "scorer"   && <ScorerScreen t={t} />}
          {view === "history"  && <HistoryScreen  t={t} />}
          {view === "settings" && <SettingsScreen t={t} />}

        </div>
      </div>
    </div>
  );
}
