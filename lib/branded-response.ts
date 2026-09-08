/**
 * Branded HTML for the two non-redirect outcomes of a card scan.
 *
 * A Route Handler cannot render a React page, and this is the one path where
 * latency is measured against a customer standing at a table with their phone
 * out -- so the markup is a self-contained string with inline styles and no
 * framework, fonts, or network requests of its own.
 */

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function page({
  title,
  heading,
  message,
}: {
  title: string;
  heading: string;
  message: string;
}): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="robots" content="noindex">
<title>${escapeHtml(title)}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100dvh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: #FAFAF9;
    color: #1C1917;
    font: 16px/1.5 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    -webkit-font-smoothing: antialiased;
  }
  .card {
    width: 100%;
    max-width: 420px;
    background: #FFFFFF;
    border: 1px solid #E7E5E4;
    border-radius: 16px;
    padding: 32px 24px;
    text-align: center;
  }
  .mark {
    width: 48px; height: 48px;
    margin: 0 auto 20px;
    border-radius: 12px;
    background: #1A73E8;
    color: #FFFFFF;
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 20px; letter-spacing: -0.02em;
  }
  h1 { margin: 0 0 8px; font-size: 20px; line-height: 1.3; letter-spacing: -0.01em; }
  p { margin: 0; color: #57534E; font-size: 15px; }
</style>
</head>
<body>
  <main class="card">
    <div class="mark" aria-hidden="true">GR</div>
    <h1>${escapeHtml(heading)}</h1>
    <p>${escapeHtml(message)}</p>
  </main>
</body>
</html>`;
}

const HEADERS = {
  "content-type": "text/html; charset=utf-8",
  // Never let a CDN or browser hold on to a card's failure state -- the card
  // may be reactivated a minute later and must start working immediately.
  "cache-control": "no-store, no-cache, must-revalidate",
  "content-security-policy":
    "default-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  "referrer-policy": "no-referrer",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
} as const;

/** 404: no route with this slug has ever existed. */
export function notFoundResponse(): Response {
  return new Response(
    page({
      title: "Card not found",
      heading: "This card isn't registered",
      message:
        "The link on this card doesn't match any review page. Please let the venue know so they can get it sorted.",
    }),
    { status: 404, headers: HEADERS },
  );
}

/** 410: the route exists but has been deactivated by its owner. */
export function inactiveResponse(): Response {
  return new Response(
    page({
      title: "Card inactive",
      heading: "This card has been deactivated",
      message:
        "The review link for this card is currently switched off. Please let the venue know if you were trying to leave a review.",
    }),
    { status: 410, headers: HEADERS },
  );
}

/** 500: the lookup itself failed. Deliberately says nothing about why. */
export function lookupErrorResponse(): Response {
  return new Response(
    page({
      title: "Something went wrong",
      heading: "We couldn't load this card",
      message: "Please try scanning again in a moment.",
    }),
    { status: 500, headers: HEADERS },
  );
}
