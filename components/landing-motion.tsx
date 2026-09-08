"use client";
import Image from "next/image";
import { useEffect, useRef } from "react";

export function LandingMotion() {
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const revealObserver = reduceMotion ? null : new IntersectionObserver(entries => {
      entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add("is-visible"); revealObserver?.unobserve(entry.target); } });
    }, { threshold: 0.12 });
    if (revealObserver) document.querySelectorAll("[data-reveal]").forEach(el => revealObserver.observe(el));

    const comparison = document.querySelector("#compare");
    const mobileOrderBar = document.querySelector("[data-mobile-order-bar]");
    const comparisonObserver = comparison && mobileOrderBar ? new IntersectionObserver(entries => {
      const visible = entries.some(entry => entry.isIntersecting);
      mobileOrderBar.classList.toggle("is-comparison-visible", visible);
    }, { threshold: 0.02 }) : null;
    if (comparisonObserver && comparison) comparisonObserver.observe(comparison);

    return () => {
      revealObserver?.disconnect();
      comparisonObserver?.disconnect();
    };
  }, []);
  return null;
}

export function ProductPhoto() {
  const stage = useRef<HTMLDivElement>(null);
  return <div className="w-[320px] max-w-[calc(100%-1rem)] transition-transform duration-300 ease-out md:w-[380px]" ref={stage} onPointerMove={event => {
    if (event.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const box = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - 0.5;
    const y = (event.clientY - box.top) / box.height - 0.5;
    if (stage.current) stage.current.style.transform = `perspective(1200px) rotateX(${-y * 7}deg) rotateY(${x * 9}deg)`;
  }} onPointerLeave={() => { if (stage.current) stage.current.style.transform = ""; }}>
    <div className="product-float motion-reduce:animate-none"><Image className="block h-auto w-full" src="/images/goreview-hero-transparent.png" alt="Goreview hero artwork showing the Google review card with Tap. Scan. Share. and ₱699 callouts" width={1011} height={1556} sizes="(max-width: 767px) 86vw, 390px" preload /></div>
  </div>;
}
