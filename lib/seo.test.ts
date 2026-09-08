import { describe, expect, it } from "vitest";

import { guides } from "@/lib/guides";
import { seoLandingPages } from "@/lib/seo-pages";
import {
  faqJsonLd,
  metadataForPage,
  productJsonLd,
  publicUrl,
  webPageJsonLd,
  websiteJsonLd,
} from "@/lib/seo";

describe("public SEO content", () => {
  it("creates indexable canonical metadata for public pages", () => {
    const metadata = metadataForPage({
      title: "Google review cards",
      description: "A description",
      path: "/google-review-card",
    });

    expect(metadata.robots).toMatchObject({ index: true, follow: true });
    expect(metadata.robots).toMatchObject({
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
      },
    });
    expect(metadata.alternates?.canonical).toBe(
      "https://goreview.rald.site/google-review-card",
    );
  });

  it("keeps landing-page URLs and guide slugs unique", () => {
    const landingPaths = seoLandingPages.map((page) => page.path);
    const guideSlugs = guides.map((guide) => guide.slug);

    expect(new Set(landingPaths).size).toBe(landingPaths.length);
    expect(new Set(guideSlugs).size).toBe(guideSlugs.length);
    expect(publicUrl(`/guides/${guideSlugs[0]}`)).toContain(guideSlugs[0]);
  });

  it("describes the review card offer without fabricated ratings", () => {
    const product = productJsonLd();
    const faq = faqJsonLd([
      { question: "Question", answer: "Answer" },
    ]);

    expect(product.offers.priceCurrency).toBe("PHP");
    expect(product.offers.price).toBe("699");
    expect(product.image).toContain(
      "https://goreview.rald.site/images/goreview-card-clean-v2.webp",
    );
    expect(websiteJsonLd["@type"]).toBe("WebSite");
    expect(webPageJsonLd({
      path: "/google-review-card",
      name: "Google review cards",
      description: "A description",
    }).isPartOf["@id"]).toBe("https://goreview.rald.site#website");
    expect(JSON.stringify(product)).not.toMatch(/aggregateRating|ratingValue/);
    expect(faq.mainEntity[0].acceptedAnswer.text).toBe("Answer");
  });
});
