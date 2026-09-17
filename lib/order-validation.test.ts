import { describe, expect, it } from "vitest";
import { estimateOrderTotal, orderInquirySchema } from "@/lib/order-validation";

const valid = {
  customer_name: "Ana",
  business_name: "Ana's Cafe",
  mobile: "09171234567",
  email: "",
  preferred_contact: "mobile",
  city: "Cagayan de Oro",
  barangay: "Carmen",
  delivery_area: "cdo",
  standee_quantity: "0",
  google_card_quantity: "1",
  facebook_card_quantity: "1",
  instagram_card_quantity: "1",
  customer_notes: "",
};

describe("order inquiry", () => {
  it("allows a mixed three-card order", () => {
    expect(orderInquirySchema.safeParse(valid).success).toBe(true);
  });

  it("rejects fewer than three adhesive cards", () => {
    expect(orderInquirySchema.safeParse({ ...valid, instagram_card_quantity: "0" }).success).toBe(false);
  });

  it("allows one standalone standee", () => {
    expect(orderInquirySchema.safeParse({ ...valid, standee_quantity: "1", google_card_quantity: "0", facebook_card_quantity: "0", instagram_card_quantity: "0" }).success).toBe(true);
  });

  it("computes fixed product pricing", () => {
    expect(estimateOrderTotal({ standee_quantity: 1, google_card_quantity: 1, facebook_card_quantity: 1, instagram_card_quantity: 1 })).toBe(1596);
  });
});
