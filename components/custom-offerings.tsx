import { FACEBOOK_URL } from "@/lib/site";

const offerings = [
  {
    id: "counter-card",
    label: "01 / COUNTER",
    title: "The card that starts it.",
    copy: "A polished NFC + QR stand for checkout counters, reception desks, cafés, and service counters.",
    kind: "counter",
  },
  {
    id: "table-sticker",
    label: "02 / TABLE",
    title: "A tap at every table.",
    copy: "Add table numbers or custom labels so guests can reach your review page without leaving their seat. Table-specific links and tracking are available as an optional setup.",
    kind: "table",
  },
  {
    id: "branded-touchpoint",
    label: "03 / CUSTOM",
    title: "Make the invitation yours.",
    copy: "Ask about branded menu cards, window decals, receipt inserts, desk signs, or another touchpoint that fits your space.",
    kind: "custom",
  },
] as const;

const qrCells = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p"] as const;

function OfferingVisual({ kind }: { kind: (typeof offerings)[number]["kind"] }) {
  if (kind === "table") {
    return (
      <div className="relative flex h-[150px] items-center justify-center overflow-hidden border-b border-line bg-[#0c0c0c]" aria-hidden="true">
        <div className="absolute inset-x-9 bottom-8 h-px bg-line-strong" />
        <div className="absolute bottom-8 left-1/2 h-12 w-24 -translate-x-1/2 rounded-t-[18px] border border-line-strong bg-surface" />
        <div className="relative z-[1] flex h-[88px] w-[68px] -translate-y-2 rotate-[-5deg] flex-col items-center justify-between rounded-md border border-[#5b5b5b] bg-elevated px-2 py-3 shadow-[10px_14px_20px_rgb(0_0_0/35%)]">
          <span className="font-mono text-[8px] tracking-[.12em] text-muted">TABLE 04</span>
          <span className="grid size-10 grid-cols-4 gap-1 rounded-sm border border-line-strong p-1 text-[6px] leading-none text-muted">{qrCells.map((cell, index) => <i className={index % 3 === 0 ? "bg-ink" : "bg-subtle/60"} key={cell} />)}</span>
          <span className="text-[8px] text-muted">tap / scan</span>
        </div>
      </div>
    );
  }

  if (kind === "custom") {
    return (
      <div className="relative flex h-[150px] items-center justify-center overflow-hidden border-b border-line bg-[#0c0c0c]" aria-hidden="true">
        <div className="absolute left-8 top-8 h-16 w-24 rotate-[-8deg] rounded border border-line-strong bg-surface p-3 shadow-[8px_10px_16px_rgb(0_0_0/30%)]"><span className="block h-1.5 w-12 rounded bg-subtle" /><span className="mt-3 block h-1 w-16 rounded bg-line-strong" /><span className="mt-2 block h-1 w-10 rounded bg-line-strong" /></div>
        <div className="absolute right-9 top-10 h-20 w-14 rotate-[10deg] rounded border border-[#5b5b5b] bg-elevated p-2 shadow-[8px_10px_16px_rgb(0_0_0/30%)]"><span className="block size-9 border border-line-strong bg-[repeating-linear-gradient(45deg,#a3a3a3_0_1px,transparent_1px_4px)]" /><span className="mt-2 block h-1 w-8 rounded bg-subtle" /></div>
        <span className="relative z-[1] rounded-full border border-line-strong bg-ink px-4 py-2 font-mono text-[10px] tracking-[.12em] text-canvas">YOUR BRAND / YOUR WAY</span>
      </div>
    );
  }

  return (
    <div className="relative flex h-[150px] items-center justify-center overflow-hidden border-b border-line bg-[#0c0c0c]" aria-hidden="true">
      <div className="absolute bottom-8 h-px w-[72%] bg-line-strong" />
      <div className="relative z-[1] flex h-[100px] w-[72px] -translate-y-1 rotate-[-7deg] flex-col justify-between rounded border border-[#5b5b5b] border-b-4 bg-elevated p-3 shadow-[10px_14px_20px_rgb(0_0_0/35%)]"><span className="text-[10px] font-medium tracking-[-.04em]">goreview.</span><span className="text-[8px] leading-3 text-muted">tap or scan<br />for a review</span><span className="self-end text-[12px] text-muted">↗</span></div>
    </div>
  );
}

export function CustomOfferings() {
  return (
    <section id="custom" data-reveal className="reveal scroll-mt-[68px] border-y border-line bg-[#101010] py-[70px] motion-reduce:opacity-100 motion-reduce:transform-none md:scroll-mt-[84px] md:py-[110px]">
      <div className="mx-auto w-[calc(100%-2.5rem)] max-w-[1180px] md:w-[calc(100%-3.5rem)] xl:w-[calc(100%-6rem)]">
        <div className="mb-8 block md:mb-[52px] md:flex md:items-end md:justify-between md:gap-7">
          <div><p className="text-[12px] font-medium leading-[1.7] tracking-[.07em] text-muted md:text-[13px]">More than a counter card</p><h2 className="mt-5 text-[clamp(2rem,8vw,2.875rem)] font-normal leading-[1.14] tracking-[-.05em] md:text-[clamp(2.25rem,4vw,3.375rem)]">Put the invitation<br /><span className="display-heading text-muted">where people are.</span></h2></div>
          <p className="mt-5 max-w-[330px] text-[14px] leading-[1.8] text-muted md:mt-0 md:pb-1 md:text-[15px]">If your guests sit down, the review prompt can sit there too. Choose a format that feels natural to your space.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
          {offerings.map(offering => <article className="overflow-hidden rounded-xl border border-line bg-surface" key={offering.id}><OfferingVisual kind={offering.kind} /><div className="p-6 md:p-5 xl:p-6"><p className="font-mono text-[11px] tracking-[.08em] text-subtle">{offering.label}</p><h3 className="mt-4 text-[19px] font-medium tracking-[-.03em]">{offering.title}</h3><p className="mt-3 text-[14px] leading-[1.8] text-muted">{offering.copy}</p></div></article>)}
        </div>
        <div className="mt-7 flex flex-col items-start justify-between gap-4 border-t border-line pt-6 md:flex-row md:items-center"><p className="max-w-[600px] text-[14px] leading-[1.8] text-muted"><strong className="font-medium text-ink">Have a specific idea?</strong> Tell us what your customers see first and we’ll help shape the right review touchpoint.</p><a href={FACEBOOK_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 py-3 text-[14px] font-medium hover:underline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink">Plan a custom setup <span aria-hidden="true">↗</span></a></div>
      </div>
    </section>
  );
}
