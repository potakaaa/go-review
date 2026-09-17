import type { ReactElement } from "react";

import type { ScanMilestone } from "@/lib/milestone";
import { PUBLIC_ORIGIN } from "@/lib/site";

/**
 * The shareable milestone graphic, 9:16 for stories and reels.
 *
 * Rendered by Satori rather than a browser, so this is deliberately plain:
 * flexbox only, no CSS variables, and every colour written out as the literal
 * the admin theme resolves to. It keeps the workspace's dark palette -- the
 * card is a picture of a private dashboard, and it should look like one.
 */
export const MILESTONE_CARD_SIZE = { width: 1080, height: 1920 };

const INK = "#f5f5f5";
const MUTED = "#a3a3a3";
const SUBTLE = "#737373";
const LINE = "#27272a";

/** Long enough for a real business name, short enough to stay on one line. */
const NAME_LIMIT = 24;

export type MilestoneCardData = {
  milestone: ScanMilestone;
  /** Active links, i.e. cards that would work if someone tapped one today. */
  cardsLive: number;
  /** Scans per used card, or null before anything has been scanned. */
  averagePerCard: number | null;
  topRoutes: Array<{ businessName: string; scans: number }>;
};

function truncate(name: string): string {
  const trimmed = name.trim();
  return trimmed.length > NAME_LIMIT
    ? `${trimmed.slice(0, NAME_LIMIT - 1).trimEnd()}…`
    : trimmed;
}

function Eyebrow({ children }: { children: string }) {
  return (
    <div
      style={{
        display: "flex",
        fontSize: 24,
        fontWeight: 600,
        letterSpacing: 2.6,
        color: SUBTLE,
      }}
    >
      {children}
    </div>
  );
}

export function milestoneCard(data: MilestoneCardData): ReactElement {
  const { milestone, cardsLive, averagePerCard, topRoutes } = data;
  const host = new URL(PUBLIC_ORIGIN).host;

  const stats: Array<{ value: string; label: string }> = [
    {
      value: cardsLive.toLocaleString("en-US"),
      label: cardsLive === 1 ? "card live" : "cards live",
    },
  ];
  if (averagePerCard !== null) {
    stats.push({
      value: averagePerCard.toLocaleString("en-US"),
      label: "avg per card",
    });
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        // Story and reel chrome eats roughly the top and bottom 10% of a
        // 9:16 frame, so nothing important starts before it.
        padding: "190px 96px 200px",
        backgroundColor: "#0a0a0a",
        color: INK,
        fontFamily: "Inter",
      }}
    >
      <div style={{ display: "flex", fontSize: 46, fontWeight: 600, letterSpacing: -1.6 }}>
        goreview.
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <Eyebrow>ALL-TIME SCANS</Eyebrow>
        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontFamily: "Bitcount",
            fontSize: 230,
            lineHeight: 1,
            letterSpacing: -6,
          }}
        >
          {milestone.label}
        </div>
        <div style={{ display: "flex", marginTop: 30, fontSize: 40, color: MUTED }}>
          taps and scans on Goreview cards.
        </div>

        <div style={{ display: "flex", marginTop: 56, gap: 64 }}>
          {stats.map((stat) => (
            <div key={stat.label} style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
              <span style={{ fontSize: 52, fontWeight: 600, letterSpacing: -1.6 }}>
                {stat.value}
              </span>
              <span style={{ fontSize: 30, color: MUTED }}>{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {topRoutes.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column" }}>
          <Eyebrow>BUSIEST CARDS</Eyebrow>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 14 }}>
            {topRoutes.map((route, index) => (
              <div
                key={route.businessName + index}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 28,
                  // Separators between rows, not a rule hanging off the last one.
                  borderTop: index === 0 ? "none" : `1px solid ${LINE}`,
                  padding: "26px 0",
                  fontSize: 38,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
                  <span style={{ color: SUBTLE, fontSize: 28 }}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span>{truncate(route.businessName)}</span>
                </div>
                <span style={{ color: MUTED }}>
                  {route.scans.toLocaleString("en-US")}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            fontSize: 68,
            fontWeight: 600,
            letterSpacing: -2.4,
            lineHeight: 1.06,
          }}
        >
          Good experiences deserve to be shared.
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 64,
            justifyContent: "space-between",
            fontSize: 32,
          }}
        >
          <span style={{ color: MUTED }}>One-time payment. Lifetime support.</span>
          <span>{host}</span>
        </div>
      </div>
    </div>
  );
}
