import { describe, expect, it, vi } from "vitest";

import {
  GOOGLE_REVIEW_RESOLVER_LIMITS,
  resolveGoogleReviewLink,
  reviewUrlForFtid,
} from "@/lib/google-review";

const FTID = "0x32fff30ed725abb3:0x105e1ea73d92646d";
const REVIEW_URL =
  `https://www.google.com/maps/place//data=!4m3!3m2!1s${FTID}!12e1`;

function redirectResponse(location: string): Response {
  return new Response(null, {
    status: 302,
    headers: { location },
  });
}

describe("reviewUrlForFtid", () => {
  it("builds Google's direct review URL", () => {
    expect(reviewUrlForFtid(FTID)).toBe(REVIEW_URL);
  });

  it("rejects values that are not feature IDs", () => {
    for (const value of [
      "",
      "not-a-feature-id",
      `${FTID}!12e1`,
      "0xabc:javascript:alert(1)",
    ]) {
      expect(reviewUrlForFtid(value), value).toBeNull();
    }
  });
});

describe("resolveGoogleReviewLink", () => {
  it("extracts an ftid already present in a Maps URL", async () => {
    const fetcher = vi.fn<typeof fetch>();
    const result = await resolveGoogleReviewLink(
      `https://maps.google.com/?ftid=${encodeURIComponent(FTID)}`,
      fetcher,
    );

    expect(result).toEqual({ ok: true, ftid: FTID, reviewUrl: REVIEW_URL });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("follows a shared-link redirect and extracts the ftid", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      redirectResponse(`https://maps.google.com/?ftid=${encodeURIComponent(FTID)}`),
    );

    const result = await resolveGoogleReviewLink(
      "https://maps.app.goo.gl/example",
      fetcher,
    );

    expect(result).toEqual({ ok: true, ftid: FTID, reviewUrl: REVIEW_URL });
    expect(fetcher).toHaveBeenCalledWith(
      new URL("https://maps.app.goo.gl/example"),
      expect.objectContaining({ redirect: "manual", method: "GET" }),
    );
  });

  it("follows multiple relative redirects", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(redirectResponse("/maps/step-two"))
      .mockResolvedValueOnce(
        redirectResponse(
          `https://maps.google.com/?ftid=${encodeURIComponent(FTID)}`,
        ),
      );

    const result = await resolveGoogleReviewLink(
      "https://goo.gl/maps/example",
      fetcher,
    );

    expect(result).toEqual({ ok: true, ftid: FTID, reviewUrl: REVIEW_URL });
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher.mock.calls[1]?.[0]).toEqual(
      new URL("https://goo.gl/maps/step-two"),
    );
  });

  it("rejects an unsupported initial host before making a request", async () => {
    const fetcher = vi.fn<typeof fetch>();
    const result = await resolveGoogleReviewLink(
      "https://example.com/maps/place",
      fetcher,
    );

    expect(result).toEqual({
      ok: false,
      message: "Paste an https:// Google Maps share link.",
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("rejects credentialed or non-default-port Maps URLs", async () => {
    const fetcher = vi.fn<typeof fetch>();

    for (const url of [
      "https://user:pass@maps.app.goo.gl/example",
      "https://maps.app.goo.gl:8443/example",
    ]) {
      const result = await resolveGoogleReviewLink(url, fetcher);
      expect(result.ok, url).toBe(false);
    }

    expect(fetcher).not.toHaveBeenCalled();
  });

  it("rejects a redirect to a non-Google host", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(redirectResponse("https://example.com/steal"));

    const result = await resolveGoogleReviewLink(
      "https://maps.app.goo.gl/example",
      fetcher,
    );

    expect(result).toEqual({
      ok: false,
      message: "Google redirected to an unsupported destination.",
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("fails clearly when a response has no usable ftid", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response("<html>not used</html>", { status: 200 }),
    );

    const result = await resolveGoogleReviewLink(
      "https://maps.app.goo.gl/example",
      fetcher,
    );

    expect(result).toEqual({
      ok: false,
      message:
        "This link did not expose a Google Maps place ID. Try copying the place’s Share link again.",
    });
  });

  it("stops after the redirect limit", async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async (input) => {
      const url = new URL(String(input));
      const step = Number(url.searchParams.get("step") ?? "0") + 1;
      return redirectResponse(
        `https://maps.google.com/maps?step=${step}`,
      );
    });

    const result = await resolveGoogleReviewLink(
      "https://maps.app.goo.gl/example",
      fetcher,
    );

    expect(result).toEqual({
      ok: false,
      message: "Google used too many redirects. Try another Maps share link.",
    });
    expect(fetcher).toHaveBeenCalledTimes(
      GOOGLE_REVIEW_RESOLVER_LIMITS.maxRedirects + 1,
    );
  });

  it("converts network failures into a safe retry message", async () => {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(new Error("down"));

    const result = await resolveGoogleReviewLink(
      "https://maps.app.goo.gl/example",
      fetcher,
    );

    expect(result).toEqual({
      ok: false,
      message: "Google could not be reached. Check the link and try again.",
    });
  });

  it("aborts a request that exceeds the timeout", async () => {
    vi.useFakeTimers();

    try {
      const fetcher = vi.fn<typeof fetch>().mockImplementation(
        async (_input, init) =>
          new Promise<Response>((_resolve, reject) => {
            init?.signal?.addEventListener(
              "abort",
              () => reject(new Error("aborted")),
              { once: true },
            );
          }),
      );

      const resultPromise = resolveGoogleReviewLink(
        "https://maps.app.goo.gl/example",
        fetcher,
      );
      await vi.advanceTimersByTimeAsync(
        GOOGLE_REVIEW_RESOLVER_LIMITS.timeoutMs,
      );

      await expect(resultPromise).resolves.toEqual({
        ok: false,
        message: "Google could not be reached. Check the link and try again.",
      });
    } finally {
      vi.useRealTimers();
    }
  });
});
