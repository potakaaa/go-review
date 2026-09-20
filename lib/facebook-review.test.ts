import { describe, expect, it, vi } from "vitest";

import {
  FACEBOOK_REVIEW_RESOLVER_LIMITS,
  facebookReviewUrlFromLink,
  resolveFacebookReviewLink,
  reviewUrlForPageHandle,
  reviewUrlForPageId,
} from "@/lib/facebook-review";

const PAGE_ID = "61589981648572";
const ID_REVIEW_URL =
  `https://www.facebook.com/profile.php?id=${PAGE_ID}&sk=reviews`;

function redirectResponse(location: string): Response {
  return new Response(null, { status: 302, headers: { location } });
}

describe("reviewUrlForPageId", () => {
  it("builds the Reviews tab URL for a numeric Page", () => {
    expect(reviewUrlForPageId(PAGE_ID)).toBe(ID_REVIEW_URL);
  });

  it("ignores punctuation left on a pasted ID", () => {
    expect(reviewUrlForPageId(`${PAGE_ID}?`)).toBe(ID_REVIEW_URL);
  });

  it("rejects values that are not Page IDs", () => {
    for (const value of ["", "12", "abc", "123abc", "1e9"]) {
      expect(reviewUrlForPageId(value), value).toBeNull();
    }
  });
});

describe("reviewUrlForPageHandle", () => {
  it("builds the Reviews tab URL for a vanity handle", () => {
    expect(reviewUrlForPageHandle("bellas.cafe")).toBe(
      "https://www.facebook.com/bellas.cafe/reviews",
    );
  });

  it("rejects Facebook's own paths and scripts", () => {
    for (const value of ["share", "groups", "profile.php", "", "a b"]) {
      expect(reviewUrlForPageHandle(value), value).toBeNull();
    }
  });
});

describe("facebookReviewUrlFromLink", () => {
  it("converts a profile.php link, trailing question mark and all", () => {
    expect(
      facebookReviewUrlFromLink(
        `https://www.facebook.com/profile.php?id=${PAGE_ID}?`,
      ),
    ).toBe(ID_REVIEW_URL);
  });

  it("drops Facebook's tracking parameters", () => {
    expect(
      facebookReviewUrlFromLink(
        `https://www.facebook.com/profile.php?id=${PAGE_ID}&mibextid=wwXIfr&rdid=Ras0Cq7EO632hVTD`,
      ),
    ).toBe(ID_REVIEW_URL);
  });

  it("converts vanity, mobile, tab and legacy Page URLs", () => {
    const expected = "https://www.facebook.com/bellascafe/reviews";
    for (const input of [
      "https://www.facebook.com/bellascafe",
      "https://www.facebook.com/bellascafe/",
      "https://m.facebook.com/bellascafe/about",
      "https://web.facebook.com/bellascafe/recommendations",
      "https://www.facebook.com/pg/bellascafe/reviews",
      "https://www.facebook.com/bellascafe/posts/123456789",
    ]) {
      expect(facebookReviewUrlFromLink(input), input).toBe(expected);
    }
  });

  it("reads the ID out of /people/ and /pages/ URLs", () => {
    for (const input of [
      `https://www.facebook.com/people/Bellas-Cafe/${PAGE_ID}/`,
      `https://www.facebook.com/pages/Bellas-Cafe/${PAGE_ID}`,
    ]) {
      expect(facebookReviewUrlFromLink(input), input).toBe(ID_REVIEW_URL);
    }
  });

  it("returns null for links that are not a Page", () => {
    for (const input of [
      "https://www.facebook.com/share/19pKsKBgcB/",
      "https://fb.me/19pKsKBgcB",
      "https://www.facebook.com/groups/123456789",
      "https://www.facebook.com/watch/?v=123456789",
      "https://www.facebook.com/",
      "http://www.facebook.com/bellascafe",
      "https://facebook.com.attacker.test/bellascafe",
      "https://www.facebook.com:8443/bellascafe",
      "not a url",
    ]) {
      expect(facebookReviewUrlFromLink(input), input).toBeNull();
    }
  });
});

describe("resolveFacebookReviewLink", () => {
  it("converts a Page URL without touching the network", async () => {
    const fetcher = vi.fn<typeof fetch>();
    const result = await resolveFacebookReviewLink(
      `https://www.facebook.com/profile.php?id=${PAGE_ID}`,
      fetcher,
    );

    expect(result).toEqual({
      ok: true,
      pageRef: PAGE_ID,
      reviewUrl: ID_REVIEW_URL,
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("follows a mobile share link to the Page it points at", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        redirectResponse(
          `https://www.facebook.com/profile.php?id=${PAGE_ID}&mibextid=wwXIfr&rdid=Ras0Cq7EO632hVTD&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F19pKsKBgcB%2F`,
        ),
      );

    const result = await resolveFacebookReviewLink(
      "https://www.facebook.com/share/19pKsKBgcB/",
      fetcher,
    );

    expect(result).toEqual({
      ok: true,
      pageRef: PAGE_ID,
      reviewUrl: ID_REVIEW_URL,
    });
    expect(fetcher).toHaveBeenCalledWith(
      new URL("https://www.facebook.com/share/19pKsKBgcB/"),
      expect.objectContaining({ redirect: "manual", method: "GET" }),
    );
  });

  it("resolves a share link that lands on a vanity Page", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        redirectResponse("https://www.facebook.com/bellascafe?mibextid=wwXIfr"),
      );

    await expect(
      resolveFacebookReviewLink("https://fb.me/19pKsKBgcB", fetcher),
    ).resolves.toEqual({
      ok: true,
      pageRef: "bellascafe",
      reviewUrl: "https://www.facebook.com/bellascafe/reviews",
    });
  });

  it("follows relative redirects", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(redirectResponse("/share/step-two/"))
      .mockResolvedValueOnce(redirectResponse(`/profile.php?id=${PAGE_ID}`));

    await expect(
      resolveFacebookReviewLink(
        "https://www.facebook.com/share/19pKsKBgcB/",
        fetcher,
      ),
    ).resolves.toEqual({
      ok: true,
      pageRef: PAGE_ID,
      reviewUrl: ID_REVIEW_URL,
    });
  });

  it("refuses a redirect that leaves Facebook", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(redirectResponse("https://attacker.test/profile.php?id=" + PAGE_ID));

    const result = await resolveFacebookReviewLink(
      "https://www.facebook.com/share/19pKsKBgcB/",
      fetcher,
    );

    expect(result.ok).toBe(false);
  });

  it("stops after the redirect limit", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(redirectResponse("https://www.facebook.com/share/loop/"));

    const result = await resolveFacebookReviewLink(
      "https://www.facebook.com/share/19pKsKBgcB/",
      fetcher,
    );

    expect(result.ok).toBe(false);
    expect(fetcher).toHaveBeenCalledTimes(
      FACEBOOK_REVIEW_RESOLVER_LIMITS.maxRedirects + 1,
    );
  });

  it("reports a share link that does not lead to a Page", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(null, { status: 200 }));

    const result = await resolveFacebookReviewLink(
      "https://www.facebook.com/share/p/19pKsKBgcB/",
      fetcher,
    );

    expect(result).toEqual({
      ok: false,
      message:
        "This link did not lead to a Facebook Page. Open the Page and copy the link from its profile.",
    });
  });

  it("rejects input that is not a Facebook link", async () => {
    const fetcher = vi.fn<typeof fetch>();
    const result = await resolveFacebookReviewLink(
      "https://maps.app.goo.gl/example",
      fetcher,
    );

    expect(result).toEqual({
      ok: false,
      message: "Paste an https:// Facebook Page or share link.",
    });
    expect(fetcher).not.toHaveBeenCalled();
  });
});
