"use client";

import { useEffect } from "react";

export default function ScrollExperience() {
  useEffect(() => {
    const progress = document.querySelector<HTMLElement>(".scrollProgress");
    const updateProgress = () => {
      if (!progress) return;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = `scaleX(${max > 0 ? window.scrollY / max : 0})`;
    };
    window.addEventListener("scroll", updateProgress, { passive: true });
    updateProgress();
    return () => window.removeEventListener("scroll", updateProgress);
  }, []);
  return <div className="scrollProgress" aria-hidden="true" />;
}
