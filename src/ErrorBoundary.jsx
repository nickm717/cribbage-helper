import { Component } from "react";

/**
 * App-level error boundary. A thrown render error would otherwise white-screen
 * the whole app; instead we show a quiet recovery card. Styling is inline and
 * theme-agnostic (the theme may be the thing that failed), kept on the felt
 * palette so it doesn't look alien.
 */
/**
 * @extends {Component<{ children: import("react").ReactNode }, { error: Error | null }>}
 */
export default class ErrorBoundary extends Component {
  /** @param {{ children: import("react").ReactNode }} props */
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  /** @param {Error} error */
  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{
        minHeight: "100dvh", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 14, padding: 32,
        background: "oklch(18% 0.030 145)", color: "oklch(94% 0.012 88)",
        fontFamily: "-apple-system, system-ui, sans-serif", textAlign: "center",
      }}>
        <div style={{ fontSize: 40 }}>🃏</div>
        <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.01em" }}>
          Something went wrong
        </div>
        <div style={{ fontSize: 13, color: "oklch(70% 0.022 100)", maxWidth: 300, lineHeight: 1.5 }}>
          The app hit an unexpected error. Reloading usually clears it; your
          saved history is untouched.
        </div>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: 4, padding: "12px 24px", borderRadius: 8, border: "none",
            background: "oklch(78% 0.138 78)", color: "oklch(18% 0.030 80)",
            fontSize: 15, fontWeight: 600, cursor: "pointer",
          }}
        >Reload</button>
      </div>
    );
  }
}
