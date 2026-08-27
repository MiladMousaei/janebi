"use client";

import { useEffect, useState } from "react";
import type { HomeData } from "../lib/types";
import Notice from "./Notice";
import ProductSection from "./ProductSection";

const emptyHome: HomeData = { featured: [], new: [], best_sellers: [], offers: [] };

export default function HomeProductRecovery() {
  const [home, setHome] = useState<HomeData>(emptyHome);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const load = async (current: number) => {
      try {
        const response = await fetch("/api/v1/products/home/", { cache: "no-store" });
        if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) throw new Error();
        const data = await response.json() as HomeData;
        if (active && [...data.featured, ...data.new, ...data.best_sellers, ...data.offers].length) {
          setHome(data);
          return;
        }
      } catch { /* The free API instance may still be waking up. */ }
      if (!active) return;
      setAttempt(current + 1);
      if (current < 24) timer = setTimeout(() => load(current + 1), 5000);
    };
    timer = setTimeout(() => load(0), 800);
    return () => { active = false; if (timer) clearTimeout(timer); };
  }, []);

  if (home.best_sellers.length || home.new.length) return <>
    <ProductSection kicker="محبوب‌ترین انتخاب کاربران" title="پرفروش‌ترین محصولات" products={home.best_sellers} />
    <ProductSection kicker="همین حالا اضافه شده" title="جدیدترین محصولات" products={home.new} />
  </>;

  return <section className="homeRecovery shell" aria-live="polite">
    <Notice kind={attempt > 24 ? "warning" : "info"} title={attempt > 24 ? "بارگذاری محصولات طولانی شد" : "در حال آماده‌کردن ویترین"}>
      {attempt > 24 ? "لطفاً چند لحظه دیگر صفحه را تازه کنید." : "سرویس محصولات در حال بیدارشدن است؛ کالاها بدون نیاز به رفرش همین‌جا نمایش داده می‌شوند."}
    </Notice>
    {attempt <= 24 && <div className="recoverySkeleton" aria-hidden="true">{[0, 1, 2, 3].map(item => <i key={item} />)}</div>}
  </section>;
}
