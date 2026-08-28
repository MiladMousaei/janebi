"use client";

import { Clock3, Zap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { Product, StoreConfiguration } from "../lib/types";
import ProductCard from "./ProductCard";

function remaining(target: string | null) {
  const distance = target ? Math.max(0, new Date(target).getTime() - Date.now()) : 0;
  return {
    total: distance,
    days: Math.floor(distance / 86400000),
    hours: Math.floor(distance / 3600000) % 24,
    minutes: Math.floor(distance / 60000) % 60,
    seconds: Math.floor(distance / 1000) % 60,
  };
}
const initialTime = { total: 1, days: 0, hours: 0, minutes: 0, seconds: 0 };

export default function FlashSaleSection({ products, configuration }: { products: Product[]; configuration: StoreConfiguration }) {
  const [time, setTime] = useState(initialTime);
  useEffect(() => {
    const tick = () => setTime(remaining(configuration.flash_sale_ends_at));
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [configuration.flash_sale_ends_at]);
  const blocks = useMemo(() => [
    [time.days, "روز"], [time.hours, "ساعت"], [time.minutes, "دقیقه"], [time.seconds, "ثانیه"],
  ] as const, [time]);
  if (!configuration.flash_sale_enabled || !products.length || !configuration.flash_sale_ends_at || time.total <= 0) return null;
  return <section className="flashSale shell" aria-label={configuration.flash_sale_title}>
    <aside>
      <span><Zap size={17} /> {configuration.flash_sale_title}</span>
      <p><Clock3 size={16} /> فرصت باقی‌مانده تا پایان تخفیف</p>
      <div className="countdown" role="timer" aria-live="off">{blocks.map(([value, label], index) => <span className="countdownChunk" key={label}>{index > 0 && <i>:</i>}<b>{value.toLocaleString("fa-IR", { minimumIntegerDigits: 2 })}<small>{label}</small></b></span>)}</div>
      <a href="/shop?discount=true">مشاهده همه</a>
    </aside>
    <div className="flashProducts">{products.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}</div>
  </section>;
}
