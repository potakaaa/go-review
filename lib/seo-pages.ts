import type { SeoFaq } from "@/lib/seo";

export type SeoLandingPage = {
  path: string;
  title: string;
  description: string;
  updatedAt: string;
  breadcrumb: string;
  answer: string;
  eyebrow: string;
  heroTitle: string;
  heroAccent: string;
  heroCopy: string;
  heroNote: string;
  benefits: readonly { title: string; description: string }[];
  steps: readonly { label: string; title: string; description: string }[];
  faqs: readonly SeoFaq[];
};

export const seoLandingPages = [
  {
    path: "/google-review-card",
    title: "Google Review Cards for Philippine Businesses | Goreview",
    description:
      "Get more genuine Google reviews with a custom NFC and QR Google review card for your business in the Philippines. One-time payment from ₱699.",
    updatedAt: "2026-09-08",
    breadcrumb: "Google review cards",
    answer:
      "A Google review card is a physical card with NFC and QR options that sends customers directly to your business's Google review page, so they do not have to search for your listing.",
    eyebrow: "A direct path to your review page",
    heroTitle: "Make your next Google review",
    heroAccent: "easier.",
    heroCopy:
      "A custom Google review card gives customers a direct path to your Google review page—one tap or scan at the counter, reception desk, table, or checkout.",
    heroNote: "Customized for your business · One-time payment · Lifetime support",
    benefits: [
      {
        title: "Less searching",
        description:
          "Customers do not need to look up your business, open Maps, and find the review button. The card takes them straight to the place to share honest feedback.",
      },
      {
        title: "One card, two ways",
        description:
          "NFC gives compatible phones a quick tap experience. The printed QR code gives every camera-equipped phone a clear backup path.",
      },
      {
        title: "Made for your counter",
        description:
          "Your card is customized and set up for your business, so the request feels like part of the customer experience—not another complicated task.",
      },
    ],
    steps: [
      {
        label: "01 / PLACE",
        title: "Put it where the experience ends",
        description:
          "Place the card at checkout, on a reception desk, beside a payment area, or anywhere customers naturally pause.",
      },
      {
        label: "02 / CONNECT",
        title: "Invite a tap or scan",
        description:
          "A customer taps an NFC-enabled phone or scans the QR code with their camera. No app download is required.",
      },
      {
        label: "03 / SHARE",
        title: "Let them write honestly",
        description:
          "Their Google review page opens while the experience is still fresh. The choice of whether and what to write stays with them.",
      },
    ],
    faqs: [
      {
        question: "What is a Google review card?",
        answer:
          "A Google review card is a physical card with an NFC tap point and QR code that sends customers to your business's Google review page.",
      },
      {
        question: "Does a Google review card guarantee more reviews?",
        answer:
          "No. Goreview reduces the steps needed to reach your review page, but customers choose whether to leave feedback and what to say. Results vary by business and customer experience.",
      },
      {
        question: "How much does a Goreview card cost?",
        answer:
          "A single customized card starts at ₱699 with a one-time payment. Lifetime support is included, and larger orders can be discussed.",
      },
    ],
  },
  {
    path: "/nfc-google-review-card",
    title: "NFC Google Review Card | Tap to Review | Goreview",
    description:
      "Help customers reach your Google review page with a tap. Custom NFC Google review cards for Philippine businesses, with QR backup and no monthly fee.",
    updatedAt: "2026-09-08",
    breadcrumb: "NFC Google review cards",
    answer:
      "An NFC Google review card lets a customer tap a compatible phone to open your business's review page, with a QR code included as a familiar backup.",
    eyebrow: "Tap to review",
    heroTitle: "One tap from a good experience",
    heroAccent: "to your review page.",
    heroCopy:
      "An NFC Google review card makes the review request feel natural: place it where the conversation happens, then let a compatible phone open your review page with a tap.",
    heroNote: "NFC tap + QR backup · No app required · No monthly card fee",
    benefits: [
      {
        title: "Fast for compatible phones",
        description:
          "Customers can tap their phone near the card and follow the notification to your Google review page.",
      },
      {
        title: "QR when NFC is unavailable",
        description:
          "The printed QR code keeps the card useful for phones without NFC or customers who prefer scanning.",
      },
      {
        title: "A visible reminder",
        description:
          "A physical card keeps the review invitation present at the moment a customer is already thinking about their experience.",
      },
    ],
    steps: [
      {
        label: "01 / SET UP",
        title: "We connect the card to your page",
        description:
          "Share your business details and Google review link. Goreview prepares the card for your business before delivery.",
      },
      {
        label: "02 / TAP",
        title: "A customer brings their phone close",
        description:
          "On a compatible phone, the NFC prompt opens the saved destination. There is no separate Goreview app to install.",
      },
      {
        label: "03 / WRITE",
        title: "They choose what to share",
        description:
          "The customer reaches Google's review flow and can leave genuine feedback in their own words.",
      },
    ],
    faqs: [
      {
        question: "Do customers need an app to use NFC?",
        answer:
          "No Goreview app is required. A compatible phone can read the NFC tag and open the destination in its browser. The QR code is available as a backup.",
      },
      {
        question: "What if a phone cannot read NFC?",
        answer:
          "Customers can use the QR code printed on the same card with their phone camera.",
      },
      {
        question: "Is there a monthly subscription?",
        answer:
          "No recurring card fee is required. Goreview cards are sold with a one-time payment and lifetime support.",
      },
    ],
  },
  {
    path: "/google-review-qr-code",
    title: "Google Review QR Code Card | QR Code for Business Reviews",
    description:
      "Give customers a simple way to find your Google review page with a custom QR code card. Goreview ships QR and NFC review cards across the Philippines.",
    updatedAt: "2026-09-08",
    breadcrumb: "Google review QR codes",
    answer:
      "A Google review QR code card opens a business's review page when a customer scans it with a phone camera, reducing the need to search for the listing manually.",
    eyebrow: "Scan at the right moment",
    heroTitle: "Turn a camera scan into",
    heroAccent: "a simpler review ask.",
    heroCopy:
      "A Google review QR code card puts your review link where customers can act on it—at the counter, after an appointment, or as they finish a meal.",
    heroNote: "Works with a phone camera · NFC included · Ships across the Philippines",
    benefits: [
      {
        title: "No typing business names",
        description:
          "A scan opens the destination directly, reducing the chance that a customer lands on the wrong listing or forgets before finding it.",
      },
      {
        title: "Readable in everyday spaces",
        description:
          "The card gives customers a physical prompt and a clear scan action without making the request part of a long script.",
      },
      {
        title: "NFC is included too",
        description:
          "Customers who prefer tapping can use the NFC point, while everyone else has the QR code as a familiar fallback.",
      },
    ],
    steps: [
      {
        label: "01 / PLACE",
        title: "Choose a natural pause",
        description:
          "Put the card at checkout, reception, a service desk, or another point where a customer has finished their interaction.",
      },
      {
        label: "02 / SCAN",
        title: "Point the camera at the code",
        description:
          "The customer scans with their phone camera and opens the saved Google review destination.",
      },
      {
        label: "03 / REVIEW",
        title: "Share real feedback",
        description:
          "The customer can decide whether to leave a review and write it in their own words—no incentive or review filtering required.",
      },
    ],
    faqs: [
      {
        question: "Can a QR code send customers directly to Google reviews?",
        answer:
          "Yes. Goreview sets up the QR code to open your business's Google review destination, so customers do not need to search for your listing first.",
      },
      {
        question: "Does the QR code work on iPhone and Android?",
        answer:
          "Most modern phones can scan a QR code with the built-in camera. NFC is included as another option for compatible phones.",
      },
      {
        question: "Can the destination be changed later?",
        answer:
          "Yes. The Goreview route behind the printed QR code is designed to remain permanent while the destination can be updated when needed.",
      },
    ],
  },
  {
    path: "/google-review-card-philippines",
    title: "Google Review Card Philippines | NFC and QR Cards | Goreview",
    description:
      "Order a customized Google review card in the Philippines. Goreview combines NFC tap, QR scan, business setup, and lifetime support from ₱699.",
    updatedAt: "2026-09-08",
    breadcrumb: "Google review cards in the Philippines",
    answer:
      "Goreview's Philippine Google review cards combine a customized NFC tap point and QR code so local businesses can give customers a direct, voluntary path to their review page.",
    eyebrow: "Made for Philippine businesses",
    heroTitle: "A better way to ask for",
    heroAccent: "Google reviews in the Philippines.",
    heroCopy:
      "Goreview gives Philippine shops, salons, restaurants, clinics, and service businesses a customized NFC and QR card that is ready for their Google review page.",
    heroNote: "From ₱699 · Ships anywhere in the Philippines · Lifetime support",
    benefits: [
      {
        title: "Built around your business",
        description:
          "Your card is set up for your business and its Google review destination before it reaches your counter.",
      },
      {
        title: "Useful across customer touchpoints",
        description:
          "Use one card at a counter, a second at reception, or discuss a larger order when several staff or locations need a simple review prompt.",
      },
      {
        title: "Support after delivery",
        description:
          "The one-time purchase includes lifetime support when you need help with your card or destination.",
      },
    ],
    steps: [
      {
        label: "01 / SHARE",
        title: "Send your business details",
        description:
          "Contact Goreview with your business information and the number of cards you need.",
      },
      {
        label: "02 / RECEIVE",
        title: "Get a card ready for your counter",
        description:
          "Your customized NFC and QR card is prepared for your Google review page and shipped anywhere in the Philippines.",
      },
      {
        label: "03 / INVITE",
        title: "Make the next step obvious",
        description:
          "Place the card at a natural customer touchpoint and invite honest feedback when the experience is fresh.",
      },
    ],
    faqs: [
      {
        question: "How much is a Google review card in the Philippines?",
        answer:
          "Goreview starts at ₱699 for one customized card. Two cards cost ₱1,199, and larger quantities can be discussed.",
      },
      {
        question: "Where does Goreview ship?",
        answer:
          "Goreview ships anywhere in the Philippines. Contact us to confirm the delivery arrangement for your location.",
      },
      {
        question: "Which businesses can use a Goreview card?",
        answer:
          "Any business with a Google Business Profile can use a review card, including restaurants, cafes, salons, clinics, retail shops, hotels, and service businesses.",
      },
    ],
  },
] as const satisfies readonly SeoLandingPage[];

export function getSeoLandingPage(path: string): SeoLandingPage | undefined {
  return seoLandingPages.find((page) => page.path === path);
}

export function requireSeoLandingPage(path: string): SeoLandingPage {
  const page = getSeoLandingPage(path);
  if (!page) throw new Error(`Missing SEO landing page configuration for ${path}`);
  return page;
}
