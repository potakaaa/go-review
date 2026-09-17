import type { ReactElement } from "react";

import type { ScanMilestone } from "@/lib/milestone";
import { PUBLIC_ORIGIN } from "@/lib/site";

/**
 * The shareable milestone graphic, 9:16 for stories and reels.
 *
 * Rendered by Satori rather than a browser, so this is deliberately plain:
 * flexbox only, no CSS variables, and every colour written out as the literal
 * the admin theme resolves to. It keeps the workspace's dark palette -- the
 * card is a screenshot of a private number, and it should look like one.
 */
export const MILESTONE_CARD_SIZE = { width: 1080, height: 1920 };

const INK = "#f5f5f5";
const MUTED = "#a3a3a3";
const SUBTLE = "#737373";
const LINE = "#27272a";

export function milestoneCard(milestone: ScanMilestone): ReactElement {
  const host = new URL(PUBLIC_ORIGIN).host;

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

      <div
        style={{
          display: "flex",
          flex: 1,
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 24,
            fontWeight: 600,
            letterSpacing: 2.6,
            color: SUBTLE,
          }}
        >
          ALL-TIME SCANS
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 28,
            fontFamily: "Bitcount",
            fontSize: 250,
            lineHeight: 1,
            letterSpacing: -6,
          }}
        >
          {milestone.label}
        </div>
        <div style={{ display: "flex", marginTop: 34, fontSize: 40, color: MUTED }}>
          taps and scans on Goreview cards.
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", height: 1, backgroundColor: LINE }} />
        <div
          style={{
            display: "flex",
            marginTop: 72,
            fontSize: 76,
            fontWeight: 600,
            letterSpacing: -2.6,
            lineHeight: 1.06,
          }}
        >
          Good experiences deserve to be shared.
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 80,
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
