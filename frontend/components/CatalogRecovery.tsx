"use client";
import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import type { Paginated, Product } from "../lib/types";
import ProductCard from "./ProductCard";
export default function CatalogRecovery({ query }: { query: string }) {
  const [result, setResult] = useState<Paginated<Product> | null>(null); const [finished, setFinished] = useState(false); const [restart, setRestart] = useState(0);
  useEffect(() => { let active = true; let timer: ReturnType<typeof setTimeout> | undefined;
    const delayFor = (attempt: number) => attempt < 3 ? 2500 : attempt < 8 ? 5000 : 15000;
    async function load(attempt: number) { try { const response = await fetch(`/api/v1/products/?${query}&recovery=${Date.now()}`, { cache: "no-store" }); if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) throw new Error(); const data = await response.json() as Paginated<Product>; if (active) { setResult(data); setFinished(true); return; } } catch { /* Retry until the sleeping API becomes available. */ } if (active) timer = setTimeout(() => void load(attempt + 1), delayFor(attempt)); }
    setFinished(false); setResult(null); timer = setTimeout(() => void load(0), restart ? 0 : 300); return () => { active = false; if (timer) clearTimeout(timer); }; }, [query, restart]);
  if (result?.results.length) return <div className="productGrid">{result.results.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}</div>;
  if (finished) return <div className="emptyState"><b>محصولی پیدا نشد</b><p>فیلترها را کمی بازتر کنید یا عبارت دیگری بنویسید.</p><a className="button primary" href="/shop">نمایش همه محصولات</a></div>;
  return <div className="catalogRecovery" role="status" aria-live="polite" aria-busy="true"><b>در حال آماده‌کردن محصولات…</b><p>کالاها پس از آماده‌شدن سرویس، بدون رفرش صفحه خودکار نمایش داده می‌شوند.</p><button className="recoveryRetry" type="button" onClick={() => setRestart(value => value + 1)}><RefreshCw aria-hidden="true" />تلاش فوری</button><div className="recoverySkeleton" aria-hidden="true">{[0, 1, 2, 3].map(item => <i key={item} />)}</div></div>;
}
