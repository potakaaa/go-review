import { z } from "zod";

export const STANDEE_PRICE = 699;
export const DUO_STANDEE_PRICE = 999;
export const TAP_CARD_PRICE = 299;
export const TAP_CARD_MINIMUM = 3;

const quantity = z.coerce.number().int().min(0).max(100);
const optionalText = (max: number) =>
  z.string().trim().max(max).optional().transform((value) => value || null);

export const orderInquirySchema = z
  .object({
    customer_name: z.string().trim().min(1, "Your name is required.").max(120),
    business_name: z.string().trim().min(1, "Business name is required.").max(120),
    mobile: z.string().trim().min(7, "Enter a valid mobile number.").max(30),
    email: optionalText(254).refine(
      (value) => value === null || z.email().safeParse(value).success,
      "Enter a valid email address.",
    ),
    preferred_contact: z.enum(["mobile", "email"]),
    city: z.string().trim().min(1, "City or municipality is required.").max(100),
    barangay: z.string().trim().min(1, "Barangay is required.").max(100),
    delivery_area: z.enum(["cdo", "outside_cdo"]),
    standee_quantity: quantity,
    duo_standee_quantity: quantity,
    google_card_quantity: quantity,
    facebook_card_quantity: quantity,
    instagram_card_quantity: quantity,
    customer_notes: optionalText(2000),
  })
  .superRefine((value, ctx) => {
    const cardQuantity =
      value.google_card_quantity +
      value.facebook_card_quantity +
      value.instagram_card_quantity;
    if (value.standee_quantity + value.duo_standee_quantity + cardQuantity === 0) {
      ctx.addIssue({ code: "custom", path: ["products"], message: "Choose at least one product." });
    }
    if (cardQuantity > 0 && cardQuantity < TAP_CARD_MINIMUM) {
      ctx.addIssue({
        code: "custom",
        path: ["products"],
        message: `Choose at least ${TAP_CARD_MINIMUM} tap cards. You can mix Google, Facebook, and Instagram.`,
      });
    }
    if (value.preferred_contact === "email" && !value.email) {
      ctx.addIssue({ code: "custom", path: ["email"], message: "Email is required when it is your preferred contact." });
    }
  });

export type OrderInquiryInput = z.infer<typeof orderInquirySchema>;

export function estimateOrderTotal(input: Pick<OrderInquiryInput, "standee_quantity" | "duo_standee_quantity" | "google_card_quantity" | "facebook_card_quantity" | "instagram_card_quantity">) {
  return input.standee_quantity * STANDEE_PRICE +
    input.duo_standee_quantity * DUO_STANDEE_PRICE +
    (input.google_card_quantity + input.facebook_card_quantity + input.instagram_card_quantity) * TAP_CARD_PRICE;
}
