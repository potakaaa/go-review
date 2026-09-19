import Image from "next/image";

import {
  ParallaxLayer,
  PressLink,
  RevealGroup,
  RevealItem,
  TiltStage,
} from "@/components/motion";
import { PublicCta, PublicFooter, PublicHeader } from "@/components/public-site";
import { container, primaryButton, secondaryButton } from "@/components/styles";

export function PlatformTapCardPage({
  platform,
  image,
  destination,
  accent,
  subject = platform,
}: {
  platform: "Facebook" | "Google" | "Instagram";
  image: string;
  destination: string;
  /** The platform's own colour, used only for the ambient glow behind the
   *  cutout -- never for text, where it would fail contrast on white. */
  accent: string;
  /** What the sentences are about, where the bare platform name would not
   *  read as a thing you can bring closer -- "your Google review", not
   *  "your Google". Defaults to the platform name. */
  subject?: string;
}) {
  const features = [
    [
      "Tap or scan",
      "Works with NFC-enabled phones and every camera that scans QR codes.",
    ],
    [
      "Direct destination",
      `Opens ${destination} without asking customers to search.`,
    ],
    [
      "Editable later",
      "The printed Goreview link stays fixed while authorized staff can update its destination.",
    ],
  ] as const;

  return (
    <>
      <PublicHeader />

      <main>
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[560px]"
            style={{
              background: `radial-gradient(90% 60% at 78% 0%, ${accent}1f 0%, transparent 62%)`,
            }}
          />
          <div
            className={`${container} grid items-center gap-12 py-12 md:grid-cols-[1.05fr_0.95fr] md:gap-14 md:py-20`}
          >
            <div>
              <p className="eyebrow">{platform} tap card</p>
              <h1 className="text-display mt-4 text-balance">
                Make your {subject}{" "}
                <span className="display-heading text-muted">one tap away.</span>
              </h1>
              <p className="text-body-lg mt-6 max-w-xl text-muted">
                A 3×4-inch adhesive NFC and QR card that opens {destination}.
                Stick it on a wall, table, counter, or anywhere customers
                naturally pause.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <PressLink href="/order" className={`${primaryButton} min-h-12 px-6`}>
                  Order {platform} cards
                </PressLink>
                <PressLink href="/#options" className={`${secondaryButton} min-h-12 px-6`}>
                  Compare card options
                </PressLink>
              </div>
              <p className="mt-5 text-[0.8125rem] text-subtle">
                ₱299 each · Minimum 3 tap cards total · Mix platforms · Free
                delivery within CDO
              </p>
            </div>

            <ParallaxLayer distance={22}>
              <TiltStage strength={9} className="relative mx-auto w-full max-w-[340px]">
                <div
                  aria-hidden="true"
                  className="absolute inset-x-[18%] bottom-[2%] -z-10 h-9 rounded-[50%] bg-ink/16 blur-2xl"
                />
                <Image
                  src={image}
                  alt={`${platform} 3×4-inch NFC and QR tap card`}
                  width={900}
                  height={1200}
                  sizes="(max-width: 767px) 70vw, 340px"
                  priority
                  className="h-auto w-full object-contain drop-shadow-[0_22px_34px_rgb(29_29_31/18%)]"
                />
              </TiltStage>
            </ParallaxLayer>
          </div>
        </section>

        <section className="border-y border-line bg-surface py-20 md:py-24">
          <div className={container}>
            <RevealGroup className="grid gap-4 md:grid-cols-3">
              {features.map(([title, copy]) => (
                <RevealItem key={title}>
                  <article className="h-full rounded-2xl border border-line bg-canvas p-7">
                    <p className="eyebrow">{title}</p>
                    <p className="mt-4 text-[0.9375rem] leading-7 text-muted">{copy}</p>
                  </article>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </section>
      </main>

      <PublicCta
        title={`Bring your ${subject} closer.`}
        description="Choose your quantities and mix platforms in one simple order inquiry."
      />
      <PublicFooter />
    </>
  );
}
