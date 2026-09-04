"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import type { HomeData } from "../lib/types";
import Notice from "./Notice";
import ProductSection from "./ProductSection";

const emptyHome: HomeData = { featured: [], new: [], best_sellers: [], offers: [] };

export default function HomeProductRecovery() {
  const [home, setHome] = useState<HomeData>(emptyHome);
  const [attempt, setAttempt] = useState(0);
  const [empty, setEmpty] = useState(false);
  const [restart, setRestart] = useState(0);

  useEffect(() => {
    let active = true;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const delayFor = (current: number) => current < 3 ? 2500 : current < 8 ? 5000 : 15000;
    const load = async (current: number) => {
      try {
        const response = await fetch(`/api/v1/products/home/?recovery=${Date.now()}`, { cache: "no-store" });
        if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) throw new Error();
        const data = await response.json() as HomeData;
        if (!active) return;
        const products = [...data.featured, ...data.new, ...data.best_sellers, ...data.offers];
        setHome(data);
        setEmpty(products.length === 0);
        return;
      } catch { /* The free API instance may still be waking up. */ }
      if (!active) return;
      setAttempt(current + 1);
      timer = setTimeout(() => void load(current + 1), delayFor(current));
    };
    setAttempt(0);
    setEmpty(false);
    timer = setTimeout(() => void load(0), restart ? 0 : 500);
    return () => { active = false; if (timer) clearTimeout(timer); };
  }, [restart]);

  if (home.best_sellers.length || home.new.length) return <>
    <ProductSection kicker="محبوب‌ترین انتخاب کاربران" title="پرفروش‌ترین محصولات" products={home.best_sellers} />
    <ProductSection kicker="همین حالا اضافه شده" title="جدیدترین محصولات" products={home.new} />
  </>;

  if (empty) return <section className="homeRecovery shell"><Notice kind="warning" title="ویترین فعلاً خالی است">محصول فعالی برای نمایش وجود ندارد.</Notice></section>;

  return <section className="homeRecovery shell" aria-live="polite" aria-busy="true">
    <Notice kind="info" title={attempt > 2 ? "در حال برقراری ارتباط با انبار" : "در حال آماده‌کردن ویترین"}>
      سرویس محصولات خودکار در حال آماده‌شدن است و کالاها بدون رفرش صفحه نمایش داده می‌شوند.
    </Notice>
    <button className="recoveryRetry" type="button" onClick={() => setRestart(value => value + 1)}><RefreshCw aria-hidden="true" />تلاش فوری</button>
    <div className="recoverySkeleton" aria-hidden="true">{[0, 1, 2, 3].map(item => <i key={item} />)}</div>
  </section>;
}
