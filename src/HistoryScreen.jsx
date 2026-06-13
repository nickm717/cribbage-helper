import { useHistory } from "./useHistory.js";
import { efficiencyPct, tierColor } from "./format.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(isoDate) {
  const [y, m, d] = isoDate.split("-");
  const dt = new Date(Number(y), Number(m) - 1, Number(d));
  return dt.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// ─── Sparkline ───────────────────────────────────────────────────────────────

function Sparkline({ data, t }) {
  if (data.length < 2) return null;

  const W = 300, H = 60;
  const effVals = data.map(d => d.efficiency);
  const minY = Math.max(0, Math.min(...effVals) - 8);
  const maxY = Math.min(100, Math.max(...effVals) + 8);
  const range = maxY - minY || 1;

  const xOf = i => (i / (data.length - 1)) * W;
  const yOf = eff => H - ((eff - minY) / range) * H;

  const pts = data.map((d, i) => `${xOf(i)},${yOf(d.efficiency)}`).join(" ");
  const areaCorners = `${xOf(data.length - 1)},${H} ${xOf(0)},${H}`;
  const ref75y = yOf(75);

  const labelIndices = [0, Math.floor((data.length - 1) / 2), data.length - 1];

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${W} ${H}`}
      style={{ display: "block", overflow: "visible" }}
    >
      {/* 75% reference line */}
      {ref75y >= 0 && ref75y <= H && (
        <line
          x1={0} y1={ref75y} x2={W} y2={ref75y}
          stroke={t.textMuted} strokeWidth="1" strokeDasharray="3 4" opacity="0.4"
        />
      )}

      {/* Area fill */}
      <polygon
        points={`${pts} ${areaCorners}`}
        fill={t.goldBright}
        opacity="0.08"
      />

      {/* Line */}
      <polyline
        points={pts}
        fill="none"
        stroke={t.goldBright}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Dots */}
      {data.map((d, i) => (
        <circle
          key={i}
          cx={xOf(i)}
          cy={yOf(d.efficiency)}
          r={i === data.length - 1 ? 3 : 2}
          fill={tierColor(d.efficiency, t)}
        />
      ))}

      {/* Date labels */}
      {labelIndices.map((i, li) => (
        <text
          key={i}
          x={xOf(i)}
          y={H + 11}
          fontSize="9"
          fill={t.textMuted}
          textAnchor={li === 0 ? "start" : li === 2 ? "end" : "middle"}
          fontFamily={t.fontUi}
        >
          {fmtDate(data[i].date)}
        </text>
      ))}
    </svg>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function HeadlineStat({ label, value, color, t }) {
  return (
    <div style={{ textAlign: "center", flex: 1 }}>
      <div style={{
        fontSize: 9, fontWeight: 700, color: t.textMuted,
        letterSpacing: "0.12em", textTransform: "uppercase",
        lineHeight: 1, marginBottom: 4,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 20, fontWeight: 700, color: color || t.textPrimary,
        fontFamily: t.fontUi,
        letterSpacing: "-0.02em", lineHeight: 1,
      }}>
        {value}
      </div>
    </div>
  );
}

function SessionRow({ session, t }) {
  const { date, hands, efficiency, grades } = session;
  const color = tierColor(efficiency, t);
  const gradeStr = `${grades.Optimal || 0} opt · ${grades.Close || 0} close · ${grades.Suboptimal || 0} sub`;

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 14px",
      background: t.feltMid,
      borderRadius: t.radius.md,
      border: `1px solid ${t.feltRule}`,
    }}>
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 600, color: t.textPrimary,
          fontFamily: t.fontUi,
        }}>
          {fmtDate(date)}
        </div>
        <div style={{ fontSize: 11, color: t.textMuted, marginTop: 2 }}>
          {hands} hand{hands === 1 ? "" : "s"} · {gradeStr}
        </div>
      </div>
      <div style={{
        fontFamily: t.fontMono,
        fontSize: 20, fontWeight: 700, color,
        letterSpacing: "-0.02em", flexShrink: 0,
      }}>
        {Math.min(100, efficiency)}%
      </div>
    </div>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function HistoryScreen({ t }) {
  const sessions = useHistory();

  if (sessions.length === 0) {
    return (
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: 32, gap: 10, background: t.feltBase,
      }}>
        <div style={{ fontSize: 40 }}>📈</div>
        <div style={{
          fontSize: 20, fontWeight: 800, color: t.textPrimary,
          fontFamily: t.fontUi, letterSpacing: "-0.01em",
        }}>
          No history yet
        </div>
        <div style={{
          fontSize: 13, color: t.textSecondary, textAlign: "center",
          maxWidth: 260, lineHeight: 1.5,
        }}>
          Play hands in the Trainer to start tracking your efficiency over time.
        </div>
      </div>
    );
  }

  // ── Derived data ────────────────────────────────────────────────────────────

  const totalYour   = sessions.reduce((s, x) => s + (x.yourPts ?? 0), 0);
  const totalOpt    = sessions.reduce((s, x) => s + (x.optPts ?? 0), 0);
  const totalYourEV = sessions.reduce((s, x) => s + (x.yourEV ?? 0), 0);
  const totalOptEV  = sessions.reduce((s, x) => s + (x.optEV  ?? 0), 0);
  const lifetimeEff = totalOptEV > 0
    ? efficiencyPct(totalYourEV, totalOptEV)
    : (totalOpt > 0 ? efficiencyPct(totalYour, totalOpt) : 100);
  const bestEff     = Math.min(100, Math.max(...sessions.map(s => s.efficiency)));

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenKey = sevenDaysAgo.toLocaleDateString("sv");
  const recentSessions = sessions.filter(s => s.date >= sevenKey);
  const recentYour   = recentSessions.reduce((s, x) => s + (x.yourPts ?? 0), 0);
  const recentOpt    = recentSessions.reduce((s, x) => s + (x.optPts ?? 0), 0);
  const recentYourEV = recentSessions.reduce((s, x) => s + (x.yourEV ?? 0), 0);
  const recentOptEV  = recentSessions.reduce((s, x) => s + (x.optEV  ?? 0), 0);
  const sevenDayEff = recentOptEV > 0
    ? efficiencyPct(recentYourEV, recentOptEV)
    : (recentOpt > 0 ? efficiencyPct(recentYour, recentOpt) : null);

  // Daily aggregation for sparkline (last 14 days)
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
  const fourteenKey = fourteenDaysAgo.toLocaleDateString("sv");
  const byDate = sessions
    .filter(s => s.date >= fourteenKey)
    .reduce((acc, s) => {
      if (!acc[s.date]) acc[s.date] = { yourPts: 0, optPts: 0, yourEV: 0, optEV: 0 };
      acc[s.date].yourPts += s.yourPts;
      acc[s.date].optPts  += s.optPts;
      acc[s.date].yourEV  += (s.yourEV ?? 0);
      acc[s.date].optEV   += (s.optEV  ?? 0);
      return acc;
    }, {});
  const dailyData = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, d]) => ({
      date,
      efficiency: d.optEV > 0
        ? efficiencyPct(d.yourEV, d.optEV)
        : (d.optPts > 0 ? efficiencyPct(d.yourPts, d.optPts) : 100),
    }));

  const recentDisplaySessions = [...sessions].reverse().slice(0, 20);

  const sectionLabel = {
    fontSize: 9, fontWeight: 700, color: t.textMuted,
    letterSpacing: "0.12em", textTransform: "uppercase",
    marginBottom: 10,
    fontFamily: t.fontUi,
  };

  return (
    <div style={{
      flex: 1, overflowY: "auto", background: t.feltBase,
    }}>
      <div style={{
        display: "flex", flexDirection: "column", gap: 20,
        padding: "14px 16px 40px",
      }}>

        {/* ── Headline stats ─────────────────────────────────────────────── */}
        <div style={{
          display: "flex", gap: 0,
          background: t.feltMid,
          borderRadius: 10,
          border: `1px solid ${t.feltRule}`,
          overflow: "hidden",
        }}>
          {[
            { label: "Lifetime", value: `${lifetimeEff}%`, color: tierColor(lifetimeEff, t) },
            { label: "Best Session", value: `${bestEff}%`, color: tierColor(bestEff, t) },
            { label: "7-Day Avg", value: sevenDayEff != null ? `${sevenDayEff}%` : "—", color: sevenDayEff != null ? tierColor(sevenDayEff, t) : t.textMuted },
          ].map((stat, i, arr) => (
            <div key={stat.label} style={{
              flex: 1, padding: "12px 8px",
              borderRight: i < arr.length - 1 ? `1px solid ${t.feltRule}` : "none",
            }}>
              <HeadlineStat label={stat.label} value={stat.value} color={stat.color} t={t} />
            </div>
          ))}
        </div>

        {/* ── 14-day sparkline ───────────────────────────────────────────── */}
        {dailyData.length >= 2 && (
          <div>
            <div style={sectionLabel}>Session Efficiency — 14 Days</div>
            <div style={{
              background: t.feltMid,
              borderRadius: 10,
              border: `1px solid ${t.feltRule}`,
              padding: "16px 16px 22px",
            }}>
              <Sparkline data={dailyData} t={t} />
            </div>
          </div>
        )}

        {/* ── Session list ───────────────────────────────────────────────── */}
        <div>
          <div style={sectionLabel}>Recent Sessions</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {recentDisplaySessions.map(s => (
              <SessionRow key={s.id} session={s} t={t} />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
