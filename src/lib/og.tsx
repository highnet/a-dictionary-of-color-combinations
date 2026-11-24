import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

/** Shared social card: colour blocks above, a sumi caption band below. */
export function ogCard({ colors, title, kicker }: { colors: string[]; title: string; kicker: string }) {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#efece4" }}>
        <div style={{ display: "flex", flex: 1, margin: "48px 48px 0" }}>
          {colors.map((c, i) => (
            <div key={i} style={{ flex: 1, background: c }} />
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "28px 48px 40px", color: "#1f1c19" }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 24, opacity: 0.7 }}>{kicker}</div>
            <div style={{ fontSize: 52, fontWeight: 700, marginTop: 6 }}>{title}</div>
          </div>
          <div style={{ display: "flex", background: "#b8442e", color: "#fbf8f2", fontSize: 30, padding: "14px 18px", fontWeight: 700 }}>
            Sanzo Wada
          </div>
        </div>
      </div>
    ),
    OG_SIZE,
  );
}
