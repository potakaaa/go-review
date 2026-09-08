import Image from "next/image";
import { FACEBOOK_URL } from "@/lib/site";

const container = "mx-auto w-[calc(100%-2.5rem)] max-w-[1180px] md:w-[calc(100%-3.5rem)] xl:w-[calc(100%-6rem)]";
const kicker = "text-[11px] font-medium uppercase leading-[1.7] tracking-[.15em] text-subtle md:text-[12px]";

const brandXDetails = [
  ["Sticker only", "Needs a clean, flat surface to stick to."],
  ["NFC tap only", "Customers need a compatible NFC phone."],
  ["No QR backup", "No second route when a phone cannot tap."],
] as const;

const goreviewDetails = [
  ["Freestanding standee", "Place it on the counter—no sticking required."],
  ["NFC tap + QR scan", "Customers can tap or use their phone camera."],
  ["Ready for your business", "Setup and lifetime support are included."],
] as const;

function DetailList({ details, emphasized = false }: { details: ReadonlyArray<readonly [string, string]>; emphasized?: boolean }) {
  return (
    <dl className="mt-6 border-t border-line">
      {details.map(([term, description], index) => (
        <div className="grid grid-cols-[32px_1fr] gap-3 border-b border-line py-4" key={term}>
          <dt className={`font-mono text-[10px] leading-6 ${emphasized ? "text-ink" : "text-subtle"}`}>0{index + 1}</dt>
          <dd>
            <span className={`block text-[14px] font-medium ${emphasized ? "text-ink" : "text-muted"}`}>{term}</span>
            <span className="mt-1 block text-[12px] leading-[1.7] text-subtle md:text-[13px]">{description}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function ComparisonSection() {
  return (
    <section id="compare" data-reveal aria-labelledby="comparison-heading" className="reveal relative isolate scroll-mt-[68px] overflow-hidden border-y border-line bg-[#0d0d0d] pb-[calc(9rem+env(safe-area-inset-bottom))] pt-[70px] motion-reduce:opacity-100 motion-reduce:transform-none md:scroll-mt-[84px] md:py-[110px]">
      <div className="pointer-events-none absolute inset-0 -z-10 hidden bg-[radial-gradient(circle_at_23%_34%,rgb(255_255_255/5%),transparent_26%),radial-gradient(circle_at_76%_36%,rgb(255_255_255/7%),transparent_29%)] md:block" aria-hidden="true" />
      <div className={container}>
        <div className="mx-auto max-w-[760px] text-center">
          <p className={kicker}>Compare before you choose</p>
          <h2 id="comparison-heading" className="mt-5 text-[clamp(2.25rem,9vw,3.25rem)] font-normal leading-[1.1] tracking-[-.055em] md:text-[clamp(3rem,5vw,4.25rem)]">One asks for a tap.<br /><span className="display-heading text-muted">One gives a choice.</span></h2>
          <p className="mx-auto mt-6 max-w-[560px] text-[14px] leading-[1.8] text-muted md:text-[16px]">See the difference between a sticker that depends on NFC and a freestanding review standee built for both tap and scan.</p>
        </div>

        <div className="mt-12 grid grid-cols-1 md:mt-16 md:grid-cols-[minmax(0,1fr)_76px_minmax(0,1fr)] md:items-stretch">
          <article className="min-w-0">
            <div className="relative flex h-[380px] items-center justify-center md:h-[540px]">
              <div className="absolute bottom-12 h-px w-[76%] bg-gradient-to-r from-transparent via-line-strong to-transparent" aria-hidden="true" />
              <div className="absolute bottom-8 h-12 w-[68%] rounded-[50%] bg-black/55 blur-xl" aria-hidden="true" />
              <Image className="relative h-auto w-full max-w-[270px] -rotate-[1.5deg] object-contain drop-shadow-[0_24px_30px_rgb(0_0_0/45%)] md:max-w-[360px]" src="/images/brand-x-card-transparent.png" alt="Brand X NFC review sticker without a QR code" width={1152} height={960} sizes="(max-width: 767px) 270px, 360px" />
            </div>
            <div className="relative z-10 mx-auto max-w-[480px] bg-[#0d0d0d] md:px-4">
              <div className="flex flex-col items-start gap-3 border-t border-line-strong pt-6 sm:flex-row sm:items-end sm:justify-between sm:gap-5">
                <div>
                  <p className={kicker}>Brand X · sticker</p>
                  <h3 className="mt-3 text-[23px] font-normal tracking-[-.04em]">Stick it. Then tap.</h3>
                </div>
                <p className="shrink-0 text-left text-[30px] font-[450] leading-none tracking-[-.06em] text-muted sm:text-right">₱899<span className="mt-2 block text-[10px] font-normal uppercase tracking-[.12em] text-subtle">each</span></p>
              </div>
              <DetailList details={brandXDetails} />
            </div>
          </article>

          <div className="relative my-10 flex items-center justify-center md:my-0 md:h-[540px] md:self-start" aria-label="versus">
            <span className="absolute inset-x-0 top-1/2 h-px bg-line md:inset-y-0 md:left-1/2 md:h-auto md:w-px" aria-hidden="true" />
            <span className="display-heading relative bg-[#0d0d0d] px-5 py-2 text-[28px] text-muted md:px-2 md:py-5 md:text-[31px]">vs.</span>
          </div>

          <article className="min-w-0">
            <div className="relative flex h-[380px] items-center justify-center md:h-[540px]">
              <div className="absolute bottom-12 h-px w-[76%] bg-gradient-to-r from-transparent via-line-strong to-transparent" aria-hidden="true" />
              <div className="absolute bottom-7 h-14 w-[52%] rounded-[50%] bg-black/65 blur-xl" aria-hidden="true" />
              <Image className="relative h-auto max-h-[350px] w-auto max-w-[88%] object-contain drop-shadow-[0_26px_34px_rgb(0_0_0/50%)] md:max-h-[500px] md:max-w-full" src="/images/goreview-standee-transparent-v3.png" alt="Goreview freestanding review standee with NFC tap and QR scan options" width={1094} height={1438} sizes="(max-width: 767px) 270px, 380px" />
            </div>
            <div className="relative z-10 mx-auto max-w-[480px] bg-[#0d0d0d] md:px-4">
              <div className="flex flex-col items-start gap-3 border-t border-ink/35 pt-6 sm:flex-row sm:items-end sm:justify-between sm:gap-5">
                <div>
                  <p className={kicker}>Goreview · standee</p>
                  <h3 className="mt-3 text-[23px] font-normal tracking-[-.04em]">Place it. Tap or scan.</h3>
                </div>
                <p className="shrink-0 text-left text-[30px] font-[450] leading-none tracking-[-.06em] sm:text-right">₱699<span className="mt-2 block text-[10px] font-normal uppercase tracking-[.12em] text-muted">one-time</span></p>
              </div>
              <DetailList details={goreviewDetails} emphasized />
            </div>
          </article>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-5 border-t border-line-strong pt-7 md:mt-16 md:flex-row md:items-center">
          <p className="max-w-[680px] text-[14px] leading-[1.8] text-muted"><strong className="font-medium text-ink">Easier to place. Easier to use.</strong> Goreview stands on its own and gives every customer two simple ways to reach your review page.</p>
          <a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-3 py-3 text-[14px] font-medium hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink">Get your Goreview standee <span aria-hidden="true">↗</span></a>
        </div>
      </div>
    </section>
  );
}
