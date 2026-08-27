/**
 * Google Maps feature IDs are the two hexadecimal identifiers separated by a
 * colon that Google puts in the `ftid` query parameter of shared links.
 */
const FTID_PATTERN = /^0x[0-9a-f]+:0x[0-9a-f]+$/i;

/** Shared-link hosts we are willing to resolve from an admin-submitted URL. */
const GOOGLE_SHORT_HOSTS = new Set([
  "g.page",
  "goo.gl",
  "maps.app.goo.gl",
]);

const MAX_REDIRECTS = 5;
const FETCH_TIMEOUT_MS = 8_000;

const REVIEW_URL_PREFIX =
  "https://www.google.com/maps/place//data=!4m3!3m2!1s";

export type GoogleReviewLinkResult =
  | {
      ok: true;
      ftid: string;
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

/**
 * Converts a Google feature ID into the review URL format used by Google's
 * own `writeAReviewUri` values.
 */
export function reviewUrlForFtid(ftid: string): string | null {
  const normalized = ftid.trim();
  if (!FTID_PATTERN.test(normalized)) return null;
  return `${REVIEW_URL_PREFIX}${normalized}!12e1`;
}

function isGoogleDomain(hostname: string): boolean {
  // This accepts google.com, google.co.uk, google.com.ph, and their normal
  // subdomains, while rejecting lookalikes such as google.com.attacker.test.
  return /^(?:[a-z0-9-]+\.)?google\.(?:com|[a-z]{2}|(?:co|com)\.[a-z]{2})$/i.test(
    hostname,
  );
}

function isAllowedMapsUrl(url: URL): boolean {
  if (url.port || url.username || url.password) return false;

  const hostname = url.hostname.toLowerCase();

  if (GOOGLE_SHORT_HOSTS.has(hostname)) {
    // goo.gl has many unrelated short links. Only its Maps path belongs to
    // this converter; g.page and maps.app.goo.gl are Maps-specific hosts.
    return (
      hostname !== "goo.gl" ||
      url.pathname === "/maps" ||
      url.pathname.startsWith("/maps/")
    );
  }

  if (hostname === "maps.google.com") return true;

  return (
    isGoogleDomain(hostname) &&
    (url.pathname === "/maps" || url.pathname.startsWith("/maps/"))
  );
}

function parseAllowedMapsUrl(input: string): URL | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }

  if (url.protocol !== "https:" || !isAllowedMapsUrl(url)) return null;
  return url;
}

function ftidFromUrl(url: URL): string | null {
  const queryValue = url.searchParams.get("ftid");
  const fromQuery = queryValue ? reviewUrlForFtid(queryValue) : null;
  if (fromQuery) return queryValue!.trim();

  // Some Google Maps URLs carry the same ID inside a `data=!1s...!` path.
  const pathMatch = url.href.match(/!1s(0x[0-9a-f]+:0x[0-9a-f]+)!/i);
  return pathMatch?.[1] && reviewUrlForFtid(pathMatch[1])
    ? pathMatch[1]
    : null;
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
        "user-agent": "ReviewRoutes/1.0",
      },
    });
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Resolves a supported Google Maps share link without the Places API.
 *
 * Redirects are followed manually so every hop can be validated before the
 * server makes another outbound request. No response body is read: the
 * converter only trusts the URL Google exposes in a redirect or query.
 */
export async function resolveGoogleReviewLink(
  input: string,
  fetcher: Fetcher = fetch,
): Promise<GoogleReviewLinkResult> {
  const initialUrl = parseAllowedMapsUrl(input);
  if (!initialUrl) {
    return {
      ok: false,
      message: "Paste an https:// Google Maps share link.",
    };
  }

  let currentUrl = initialUrl;

  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects++) {
    const ftid = ftidFromUrl(currentUrl);
    const reviewUrl = ftid ? reviewUrlForFtid(ftid) : null;
    if (ftid && reviewUrl) return { ok: true, ftid, reviewUrl };

    let response: Response;
    try {
      response = await fetchWithTimeout(fetcher, currentUrl);
    } catch {
      return {
        ok: false,
        message: "Google could not be reached. Check the link and try again.",
      };
    }

    // A custom fetch implementation or a future runtime may expose a final
    // URL even when it did not provide a Location header. Trust it only after
    // applying the same host/path checks as every redirect.
    if (response.url) {
      const responseUrl = parseAllowedMapsUrl(response.url);
      const responseFtid = responseUrl && ftidFromUrl(responseUrl);
      const responseReviewUrl = responseFtid
        ? reviewUrlForFtid(responseFtid)
        : null;
      if (responseFtid && responseReviewUrl) {
        return {
          ok: true,
          ftid: responseFtid,
          reviewUrl: responseReviewUrl,
        };
      }
    }

    if (!redirectStatus(response.status)) {
      return {
        ok: false,
        message:
          "This link did not expose a Google Maps place ID. Try copying the place’s Share link again.",
      };
    }

    if (redirects === MAX_REDIRECTS) {
      return {
        ok: false,
        message: "Google used too many redirects. Try another Maps share link.",
      };
    }

    const location = response.headers.get("location");
    if (!location) {
      return {
        ok: false,
        message: "Google returned an incomplete redirect. Try again.",
      };
    }

    let nextUrl: URL;
    try {
      nextUrl = new URL(location, currentUrl);
    } catch {
      return {
        ok: false,
        message: "Google returned an invalid redirect. Try another Maps link.",
      };
    }

    if (nextUrl.protocol !== "https:" || !isAllowedMapsUrl(nextUrl)) {
      return {
        ok: false,
        message: "Google redirected to an unsupported destination.",
      };
    }

    currentUrl = nextUrl;
  }

  return {
    ok: false,
    message: "Google used too many redirects. Try another Maps share link.",
  };
}

export const GOOGLE_REVIEW_RESOLVER_LIMITS = {
  maxRedirects: MAX_REDIRECTS,
  timeoutMs: FETCH_TIMEOUT_MS,
} as const;
