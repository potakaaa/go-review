import { describe, expect, it } from "vitest";

import {
  createStandeeBatchSchema,
  createStandeeSchema,
  fieldErrors,
} from "@/lib/validation";

const FACEBOOK = {
  platform: "facebook",
  destination_url: "https://www.facebook.com/bellascafe",
  maps_url: "",
};
const GOOGLE = {
  platform: "google",
  destination_url: "https://g.page/r/CQ123abc/review",
  maps_url: "https://maps.app.goo.gl/abc123",
};

function parseStandee(slots: unknown[]) {
  return createStandeeSchema.safeParse({
    business_name: "Bella's Cafe",
    notes: "",
    slots,
  });
}

describe("createStandeeSchema", () => {
  it("accepts the Facebook plus Google Maps stand", () => {
    const result = parseStandee([FACEBOOK, GOOGLE]);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.slots).toHaveLength(2);
      expect(result.data.slots[1].maps_url).toBe(
        "https://maps.app.goo.gl/abc123",
      );
    }
  });

  it("accepts four QR codes on one stand", () => {
    const result = parseStandee([
      FACEBOOK,
      GOOGLE,
      {
        platform: "instagram",
        destination_url: "https://www.instagram.com/bellascafe/",
        maps_url: "",
      },
      {
        platform: "facebook",
        destination_url: "https://www.facebook.com/bellascafe/reviews",
        maps_url: "",
      },
    ]);

    expect(result.success).toBe(true);
  });

  it("needs at least two QR codes to be a standee", () => {
    const result = parseStandee([GOOGLE]);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(fieldErrors(result.error).slots).toMatch(/at least 2/);
    }
  });

  it("refuses more than four QR codes", () => {
    const result = parseStandee([FACEBOOK, GOOGLE, FACEBOOK, GOOGLE, FACEBOOK]);

    expect(result.success).toBe(false);
  });

  it("reports a wrong link against the slot that owns it", () => {
    const result = parseStandee([
      FACEBOOK,
      { ...GOOGLE, destination_url: "https://www.facebook.com/bellascafe/x" },
    ]);

    expect(result.success).toBe(false);
    if (!result.success) {
      const errors = fieldErrors(result.error);
      expect(errors["slots.1.destination_url"]).toMatch(/Google/);
      expect(errors["slots.0.destination_url"]).toBeUndefined();
    }
  });

  it("rejects the same destination printed twice", () => {
    const result = parseStandee([FACEBOOK, { ...FACEBOOK }]);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(fieldErrors(result.error)["slots.1.destination_url"]).toMatch(
        /own destination/,
      );
    }
  });

  it("keeps Maps source links off non-Google slots", () => {
    const result = parseStandee([
      { ...FACEBOOK, maps_url: "https://maps.app.goo.gl/abc123" },
      GOOGLE,
    ]);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(fieldErrors(result.error)["slots.0.maps_url"]).toMatch(/Google/);
    }
  });
});

describe("createStandeeBatchSchema", () => {
  function parseRun(slots: unknown[], quantity: string) {
    return createStandeeBatchSchema.safeParse({
      business_name: "Bella's Cafe",
      notes: "",
      slots,
      quantity,
    });
  }

  it("accepts a run inside the batch ceiling", () => {
    expect(parseRun([FACEBOOK, GOOGLE], "50").success).toBe(true);
  });

  it("caps the run by how many QR codes each stand carries", () => {
    const result = parseRun([FACEBOOK, GOOGLE], "51");

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(fieldErrors(result.error).quantity).toMatch(/at most 50/);
    }

    const four = parseRun(
      [
        FACEBOOK,
        GOOGLE,
        {
          platform: "instagram",
          destination_url: "https://www.instagram.com/bellascafe/",
          maps_url: "",
        },
        {
          platform: "facebook",
          destination_url: "https://www.facebook.com/bellascafe/reviews",
          maps_url: "",
        },
      ],
      "26",
    );
    expect(four.success).toBe(false);
    if (!four.success) {
      expect(fieldErrors(four.error).quantity).toMatch(/at most 25/);
    }
  });

  it("still requires a run of two or more", () => {
    expect(parseRun([FACEBOOK, GOOGLE], "1").success).toBe(false);
  });
});
