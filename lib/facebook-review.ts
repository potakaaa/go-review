/**
 * Facebook review-link converter.
 *
 * Mirrors `lib/google-review.ts`: an admin pastes whatever Facebook handed
 * them — a desktop Page URL, a `profile.php?id=` link, or one of the opaque
 * `/share/…` links the iOS and Android apps produce — and gets back the URL
 * that opens that Page's Reviews tab.
 */

/** Numeric Page IDs. Facebook's own IDs are long; short values are typos. */
const PAGE_ID_PATTERN = /^\d{5,}$/;

/**
 * Vanity handles allow letters, digits and periods; legacy Page URLs also
 * carry hyphens (`Bellas-Cafe-123456789`). `.php` endpoints are Facebook
 * scripts, never handles.
 */
const HANDLE_PATTERN = /^[A-Za-z0-9.-]{2,}$/;

/** Hosts whose paths are real Page paths we can read without a round trip. */
const FACEBOOK_HOSTS = new Set([
  "facebook.com",
  "www.facebook.com",
  "m.facebook.com",
  "web.facebook.com",
  "mbasic.facebook.com",
  "business.facebook.com",
]);

/**
 * Shorteners. Their single path segment is an opaque token, never a handle,
 * so a link on one of these hosts is only ever resolved by following it.
 */
const FACEBOOK_SHORT_HOSTS = new Set(["fb.me", "fb.com", "www.fb.com"]);

/**
 * First path segments that belong to Facebook itself rather than to a Page.
 * `share` is listed because those links must be followed, not guessed at.
 */
const RESERVED_SEGMENTS = new Set([
  "share",
  "sharer",
  "dialog",
  "plugins",
  "groups",
  "events",
  "marketplace",
  "watch",
  "gaming",
  "games",
  "reel",
  "stories",
  "story",
  "messages",
  "notes",
  "search",
  "hashtag",
  "help",
  "settings",
  "privacy",
  "policies",
  "legal",
  "policy",
  "ads",
  "business",
  "bookmarks",
  "friends",
  "home",
  "login",
  "recover",
  "checkpoint",
  "media",
  "photo",
  "photos",
  "video",
  "l",
  "lite",
  "download",
  "public",
]);

const MAX_REDIRECTS = 5;
const FETCH_TIMEOUT_MS = 8_000;

export type FacebookReviewLinkResult =
  | {
      ok: true;
      /** The Page's numeric ID or vanity handle, whichever Facebook exposed. */
      pageRef: string;
      reviewUrl: string;
    }
  | {
      ok: false;
      message: string;
    };

type Fetcher = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<Response>;

/** Builds the Reviews URL for a numeric Page ID. */
export function reviewUrlForPageId(id: string): string | null {
  const normalized = trimTrailingPunctuation(id);
  if (!PAGE_ID_PATTERN.test(normalized)) return null;
  return `https://www.facebook.com/profile.php?id=${normalized}&sk=reviews`;
}

/** Builds the Reviews URL for a vanity handle such as `bellascafe`. */
export function reviewUrlForPageHandle(handle: string): string | null {
  const normalized = trimTrailingPunctuation(handle);
  if (
    !HANDLE_PATTERN.test(normalized) ||
    normalized.toLowerCase().endsWith(".php") ||
    RESERVED_SEGMENTS.has(normalized.toLowerCase())
  ) {
    return null;
  }
  // An all-numeric handle is really a Page ID wearing a path segment.
  if (/^\d+$/.test(normalized)) return reviewUrlForPageId(normalized);
  return `https://www.facebook.com/${normalized}/reviews`;
}

/**
 * Apps and humans both leave stray characters on a pasted ID — the trailing
 * `?` on `profile.php?id=123?` is the common one.
 */
function trimTrailingPunctuation(value: string): string {
  return value.trim().replace(/[?/#&.,;:]+$/, "");
}

function isShortHost(hostname: string): boolean {
  return FACEBOOK_SHORT_HOSTS.has(hostname);
}

function isAllowedFacebookUrl(url: URL): boolean {
  if (url.port || url.username || url.password) return false;
  const hostname = url.hostname.toLowerCase();
  return FACEBOOK_HOSTS.has(hostname) || isShortHost(hostname);
}

function parseAllowedFacebookUrl(input: string): URL | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || !isAllowedFacebookUrl(url)) return null;
  return url;
}

/**
 * Reads the Page out of a Facebook URL, or returns null when the URL has to
 * be followed first (share links) or points at something that is not a Page.
 */
function pageRefFromUrl(url: URL): string | null {
  // Shortener paths are opaque tokens; only the redirect knows the Page.
  if (isShortHost(url.hostname.toLowerCase())) return null;

  const segments = url.pathname.split("/").filter(Boolean);
  const first = (segments[0] ?? "").toLowerCase();

  if (first === "profile.php" || first === "people" || first === "pages") {
    // `/profile.php?id=123`, `/people/Any-Name/123`, `/pages/Any-Name/123`.
    const queryId = url.searchParams.get("id");
    if (queryId && reviewUrlForPageId(queryId)) {
      return trimTrailingPunctuation(queryId);
    }
    const trailing = segments
      .slice(1)
      .reverse()
      .find((segment) => PAGE_ID_PATTERN.test(trimTrailingPunctuation(segment)));
    return trailing ? trimTrailingPunctuation(trailing) : null;
  }

  // `/pg/<handle>/reviews` is the older Page layout.
  const handleSegment = first === "pg" ? segments[1] : segments[0];
  if (!handleSegment) return null;

  const candidate = trimTrailingPunctuation(handleSegment);
  return reviewUrlForPageHandle(candidate) ? candidate : null;
}

function reviewUrlForPageRef(pageRef: string): string | null {
  return PAGE_ID_PATTERN.test(pageRef)
    ? reviewUrlForPageId(pageRef)
    : reviewUrlForPageHandle(pageRef);
}

/**
 * Converts a Facebook Page URL without any network access.
 *
 * Returns null for share links and shortened links, which cannot be read
 * without asking Facebook where they point.
 */
export function facebookReviewUrlFromLink(input: string): string | null {
  const url = parseAllowedFacebookUrl(input);
  if (!url) return null;
  const pageRef = pageRefFromUrl(url);
  return pageRef ? reviewUrlForPageRef(pageRef) : null;
}

function redirectStatus(status: number): boolean {
  return (
    status === 301 ||
    status === 302 ||
    status === 303 ||
    status === 307 ||
    status === 308
  );
}

async function fetchWithTimeout(
  fetcher: Fetcher,
  url: URL,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    return await fetcher(url, {
      method: "GET",
      redirect: "manual",
      signal: controller.signal,
      headers: {
        accept: "text/html,application/xhtml+xml",
        // Facebook answers a browser user-agent with a 400 on `/share/` links
        // but redirects a plain client straight to the canonical Page.
        "user-agent": "ReviewRoutes/1.0",
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Resolves any supported Facebook Page link into its Reviews URL.
 *
 * Page URLs are converted locally. Share links are followed one hop at a
 * time so every destination is checked against the host allowlist before the
 * server makes another outbound request; no response body is ever read.
 */
export async function resolveFacebookReviewLink(
  input: string,
  fetcher: Fetcher = fetch,
): Promise<FacebookReviewLinkResult> {
  const initialUrl = parseAllowedFacebookUrl(input);
  if (!initialUrl) {
    return {
      ok: false,
      message: "Paste an https:// Facebook Page or share link.",
    };
  }

  let currentUrl = initialUrl;

  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects++) {
    const pageRef = pageRefFromUrl(currentUrl);
    const reviewUrl = pageRef ? reviewUrlForPageRef(pageRef) : null;
    if (pageRef && reviewUrl) return { ok: true, pageRef, reviewUrl };

    let response: Response;
    try {
      response = await fetchWithTimeout(fetcher, currentUrl);
    } catch {
      return {
        ok: false,
        message: "Facebook could not be reached. Check the link and try again.",
      };
    }

    // A runtime that resolved the redirect itself still has to pass the same
    // host checks before its final URL is trusted.
    if (response.url) {
      const responseUrl = parseAllowedFacebookUrl(response.url);
      const responseRef = responseUrl && pageRefFromUrl(responseUrl);
      const responseReviewUrl = responseRef
        ? reviewUrlForPageRef(responseRef)
        : null;
      if (responseRef && responseReviewUrl) {
        return {
          ok: true,
          pageRef: responseRef,
          reviewUrl: responseReviewUrl,
        };
      }
    }

    if (!redirectStatus(response.status)) {
      return {
        ok: false,
        message:
          "This link did not lead to a Facebook Page. Open the Page and copy the link from its profile.",
      };
    }

    if (redirects === MAX_REDIRECTS) {
      return {
        ok: false,
        message: "Facebook used too many redirects. Try the Page's own link.",
      };
    }

    const location = response.headers.get("location");
    if (!location) {
      return {
        ok: false,
        message: "Facebook returned an incomplete redirect. Try again.",
      };
    }

    let nextUrl: URL;
    try {
      nextUrl = new URL(location, currentUrl);
    } catch {
      return {
        ok: false,
        message: "Facebook returned an invalid redirect. Try the Page's link.",
      };
    }

    if (nextUrl.protocol !== "https:" || !isAllowedFacebookUrl(nextUrl)) {
      return {
        ok: false,
        message: "Facebook redirected to an unsupported destination.",
      };
    }

    currentUrl = nextUrl;
  }

  return {
    ok: false,
    message: "Facebook used too many redirects. Try the Page's own link.",
  };
}

export const FACEBOOK_REVIEW_RESOLVER_LIMITS = {
  maxRedirects: MAX_REDIRECTS,
  timeoutMs: FETCH_TIMEOUT_MS,
} as const;
