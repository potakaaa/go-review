/**
 * Milestone copy for the shareable analytics graphic.
 *
 * A raw counter ("237 scans") is a weaker thing to post than a round number,
 * so anything past the first step is rounded down to the nearest 50 and gains
 * a plus. Rounding *down* matters: the claim on the card is then always one
 * the database can back up.
 */

const STEP = 50;

export type ScanMilestone = {
  /** The rounded figure the card leads with. */
  value: number;
  /** That figure as it is set on the card, e.g. `200+`. */
  label: string;
  /** True while the count is too small to round, so the card shows it exactly. */
  exact: boolean;
};

export function scanMilestone(totalScans: number): ScanMilestone {
  const scans = Math.max(0, Math.floor(totalScans));

  if (scans < STEP) {
    return { value: scans, label: scans.toLocaleString("en-US"), exact: true };
  }

  const value = Math.floor(scans / STEP) * STEP;
  return { value, label: `${value.toLocaleString("en-US")}+`, exact: false };
}

export function milestoneFileName(milestone: ScanMilestone): string {
  return `goreview-${milestone.value}-scans.png`;
}

/**
 * Scans per card that has actually been used. Dividing by every card ever
 * created would quietly punish the card printed yesterday, so the cards with
 * no scans yet stay out of the denominator.
 */
export function averageScansPerCard(
  totalScans: number,
  scannedCards: number,
): number | null {
  if (scannedCards <= 0) return null;
  return Math.round(totalScans / scannedCards);
}
