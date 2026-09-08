import type { SeoFaq } from "@/lib/seo";

export type GuideSection = {
  heading: string;
  paragraphs: readonly string[];
  bullets?: readonly string[];
};

export type Guide = {
  slug: string;
  title: string;
  description: string;
  excerpt: string;
  answer: string;
  updatedAt: string;
  readTime: string;
  sections: readonly GuideSection[];
  faqs?: readonly SeoFaq[];
};

export const guides = [
  {
    slug: "how-to-get-more-google-reviews",
    title: "How to Get More Google Reviews for Your Business",
    description:
      "A practical, policy-aware guide to asking real customers for more genuine Google reviews without incentives or awkward follow-ups.",
    excerpt:
      "Make the request timely, make the link easy to reach, and let customers decide what to say.",
    answer:
      "To get more genuine Google reviews, ask real customers at a natural moment, send them directly to your review page, and never require a positive rating or offer an incentive.",
    updatedAt: "2026-09-08",
    readTime: "6 min read",
    sections: [
      {
        heading: "Ask while the experience is still fresh",
        paragraphs: [
          "The best time to invite a review is usually close to the moment a customer has finished their interaction with your business. A restaurant can ask after a meal, a salon after an appointment, and a service business after the work is complete.",
          "Keep the request short and human. Explain that their honest feedback helps your business, then give them a direct next step instead of asking them to search for your listing.",
        ],
      },
      {
        heading: "Give customers a direct Google review link",
        paragraphs: [
          "Every extra search step is an opportunity for a customer to get distracted or postpone the review. A direct review link, QR code, or NFC card opens the path from the place where the request happens.",
          "A physical Google review card works well for counters, reception desks, service areas, and tables because it stays visible after the spoken request is over.",
        ],
        bullets: [
          "Place the prompt at a natural pause, not in the middle of service.",
          "Use a QR code so customers can scan with a familiar phone camera.",
          "Add NFC as a fast option for compatible phones.",
          "Test the destination on both iPhone and Android before printing.",
        ],
      },
      {
        heading: "Ask fairly and avoid incentives",
        paragraphs: [
          "A review request should not require a five-star rating, a positive sentiment, or a reward. Google says incentives offered in exchange for reviews are prohibited, and businesses should not selectively request only positive reviews.",
          "The safest approach is to invite genuine feedback from customers who have actually experienced your business and leave the content of the review to them.",
        ],
      },
      {
        heading: "Reply to the reviews you receive",
        paragraphs: [
          "A thoughtful reply shows future customers that the business is paying attention. Thank people for specific feedback, answer useful questions, and respond professionally when the experience was not perfect.",
          "Review replies are also a source of customer language. They can help you notice recurring questions and improve the experience that customers describe online.",
        ],
      },
      {
        heading: "Make review requests part of the workflow",
        paragraphs: [
          "Consistent, respectful requests usually work better than a one-off campaign. Decide who asks, when they ask, and where the link or card lives. Then review the process periodically without treating the review count as a promise.",
        ],
      },
    ],
    faqs: [
      {
        question: "Can I offer a discount for a Google review?",
        answer:
          "No. Google says incentives offered in exchange for reviews are prohibited. Ask for genuine feedback without making a reward conditional on a review.",
      },
      {
        question: "Do more Google reviews guarantee better search rankings?",
        answer:
          "No. Reviews can help customers evaluate a business, but no card, link, or review count guarantees a position in Google Search or Maps.",
      },
      {
        question: "Should I ask only happy customers for reviews?",
        answer:
          "Ask customers who had a genuine experience, but do not gate the request by requiring positive sentiment or a particular star rating. Customers should be free to share honest feedback.",
      },
    ],
  },
  {
    slug: "google-review-link-qr-code",
    title: "How to Create a Google Review Link and QR Code",
    description:
      "Learn how a direct Google review link and QR code can remove search steps for customers and make an honest review request easier to act on.",
    excerpt:
      "Start with the correct Business Profile review destination, test it, and place the QR code where customers naturally pause.",
    answer:
      "Create a Google review QR code by copying your Business Profile review link, turning that link into a high-contrast QR code, testing it on multiple phones, and placing it where customers naturally finish their interaction.",
    updatedAt: "2026-09-08",
    readTime: "5 min read",
    sections: [
      {
        heading: "Start with your verified business listing",
        paragraphs: [
          "A QR code is only useful when it opens the right business. Begin by signing in to the Google account that manages your Business Profile and use Google's current review-link flow to copy the request link.",
          "Google's interface can change, so use the official Business Profile instructions as the source of truth when you create or refresh the link.",
        ],
        bullets: [
          "Check the business name and location before copying the link.",
          "Confirm that the destination is the review flow, not only the general Maps listing.",
          "Open the link in a private browser window to test the customer experience.",
        ],
      },
      {
        heading: "Turn the link into a QR code",
        paragraphs: [
          "A QR code is a visual shortcut: the customer points their camera at the code and follows the prompt. It should be large enough to scan comfortably, have clear contrast, and sit on a surface that is easy to reach.",
          "Add a plain-language instruction such as 'Scan to share your experience' so customers understand why the code is there.",
        ],
      },
      {
        heading: "Put the code where the request makes sense",
        paragraphs: [
          "The most useful placement is close to the end of the customer interaction. Try a checkout counter, reception desk, service handoff, table, packaging insert, or follow-up message—then measure which touchpoint customers actually use.",
        ],
        bullets: [
          "Avoid placing the code behind clutter or at an awkward scanning angle.",
          "Keep it away from other dense QR codes that could confuse customers.",
          "Use the same destination everywhere so testing and support stay simple.",
        ],
      },
      {
        heading: "Keep a change path after printing",
        paragraphs: [
          "A printed QR code is difficult to replace when a listing changes. Goreview puts a permanent route between the printed code and the current Google destination, so the destination can be updated without printing every card again.",
        ],
      },
    ],
    faqs: [
      {
        question: "Can I use the same Google review QR code forever?",
        answer:
          "The Google destination can change if your listing changes. A managed redirect layer such as Goreview can keep the printed QR URL permanent while the destination is updated behind it.",
      },
      {
        question: "Do customers need a special QR app?",
        answer:
          "Most current iPhone and Android phones can scan QR codes through the built-in camera. The exact prompt varies by device.",
      },
    ],
  },
  {
    slug: "nfc-vs-qr-google-reviews",
    title: "NFC vs QR Code for Google Reviews: Which Should You Use?",
    description:
      "Compare NFC tap cards and QR code cards for Google reviews, including phone compatibility, customer friction, placement, and the value of using both.",
    excerpt:
      "NFC is quick for compatible phones; QR is familiar and broadly accessible. A card with both gives customers a choice.",
    answer:
      "NFC is usually the fastest option on compatible phones, while QR is familiar and broadly accessible; using both on one Google review card gives customers a choice.",
    updatedAt: "2026-09-08",
    readTime: "5 min read",
    sections: [
      {
        heading: "NFC is a quick tap experience",
        paragraphs: [
          "With NFC, a customer brings a compatible phone close to the card and follows the notification that appears. There is no need to frame a camera or type a business name, which can make the request feel nearly effortless.",
          "NFC behavior depends on the phone, operating system, settings, and the customer's familiarity with tapping. It is best treated as a fast option rather than the only route.",
        ],
      },
      {
        heading: "QR codes are familiar and visible",
        paragraphs: [
          "A QR code works through the phone camera and communicates its action visually. Customers who do not use NFC can still scan the code, and staff can explain the action in a few words.",
          "Good contrast, enough physical size, and a clear instruction matter more than decorative complexity. Always test the printed version rather than relying only on a screen preview.",
        ],
      },
      {
        heading: "Using both reduces avoidable friction",
        paragraphs: [
          "An NFC and QR review card lets the customer choose the interaction that makes sense for their phone. The card can say 'Tap or scan to share your experience' and let the two routes lead to the same destination.",
        ],
        bullets: [
          "Use NFC for customers who prefer a fast tap.",
          "Use QR for customers who prefer a visible camera action.",
          "Keep both destinations tested and consistent.",
          "Invite honest feedback without promising a rating or reward.",
        ],
      },
      {
        heading: "Choose placement before technology",
        paragraphs: [
          "The best technology cannot fix a review request that appears at the wrong moment. Start with the customer journey: identify where the experience ends, place the card there, and give staff a short, respectful sentence to use.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is NFC better than a QR code for Google reviews?",
        answer:
          "Neither is best for every customer. NFC can be faster on compatible phones, while QR codes are familiar and visible. Using both gives customers more than one low-friction option.",
      },
      {
        question: "Does NFC work on every phone?",
        answer:
          "NFC support and behavior vary by phone and settings. That is why a QR code is a useful fallback on a physical review card.",
      },
    ],
  },
] as const satisfies readonly Guide[];

export function getGuide(slug: string): Guide | undefined {
  return guides.find((guide) => guide.slug === slug);
}
