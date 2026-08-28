"use client";

import { useEffect } from "react";

export default function ScrollExperience() {
  useEffect(() => {
    const progress = document.querySelector<HTMLElement>(".scrollProgress");
    let ticking = false;
    let revealObserver: IntersectionObserver | null = null;
    let mutationObserver: MutationObserver | null = null;
    let scanTimer: ReturnType<typeof setTimeout> | null = null;
    const updateProgress = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        if (progress) progress.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
        document.documentElement.style.setProperty("--magic-scroll", `${Math.min(window.scrollY, 700)}px`);
        ticking = false;
      });
    };
    const scan = () => {
      if (!revealObserver) return;
      const selector = ".section, .flashSale, .serviceStrip, .newsletter, .catalogTitle, .shopBanner, .catalogWorkspace, .step, .adminWelcome, .adminStats > a, .adminDashboardGrid > section, .aiForecastPanel, .adminSettingsCard, .storeSettingsCard, .ticketConversation, .smsComposer, .smsHistory";
      document.querySelectorAll<HTMLElement>(selector).forEach((element, index) => {
        if (element.dataset.magicReveal) return;
        element.dataset.magicReveal = String(index % 4);
        element.classList.add("magicReveal");
        revealObserver?.observe(element);
      });
    };
    const initialize = () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
      document.documentElement.classList.add("magicMotionReady");
      revealObserver = new IntersectionObserver(entries => entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("magicVisible");
        revealObserver?.unobserve(entry.target);
      }), { rootMargin: "0px 0px -9%", threshold: 0.08 });
      scan();
      mutationObserver = new MutationObserver(() => {
        if (scanTimer) clearTimeout(scanTimer);
        scanTimer = setTimeout(scan, 450);
      });
      mutationObserver.observe(document.body, { childList: true, subtree: true });
    };
    window.addEventListener("scroll", updateProgress, { passive: true });
    updateProgress();
    // Next can hydrate streamed siblings after this client component mounts. Waiting
    // keeps the reveal classes from racing React's first reconciliation.
    const initTimer = setTimeout(initialize, document.readyState === "complete" ? 1800 : 2400);
    return () => {
      clearTimeout(initTimer);
      if (scanTimer) clearTimeout(scanTimer);
      revealObserver?.disconnect();
      mutationObserver?.disconnect();
      window.removeEventListener("scroll", updateProgress);
    };
  }, []);
  return <div className="scrollProgress" aria-hidden="true" />;
}
