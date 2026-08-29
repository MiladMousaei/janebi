"use client";
import { useEffect, useState } from "react";
import type { Paginated, Product } from "../lib/types";
import ProductCard from "./ProductCard";
export default function CatalogRecovery({ query }: { query: string }) {
  const [result, setResult] = useState<Paginated<Product> | null>(null); const [finished, setFinished] = useState(false);
  useEffect(() => { let active = true; let timer: ReturnType<typeof setTimeout> | undefined;
    async function load(attempt: number) { try { const response = await fetch(`/api/v1/products/?${query}`, { cache: "no-store" }); if (!response.ok) throw new Error(); const data = await response.json() as Paginated<Product>; if (active) { setResult(data); if (data.results.length || attempt >= 4) { setFinished(true); return; } } } catch { if (active && attempt >= 4) setFinished(true); } if (active && attempt < 4) timer = setTimeout(() => void load(attempt + 1), 1400 * (attempt + 1)); }
    void load(0); return () => { active = false; if (timer) clearTimeout(timer); }; }, [query]);
  if (result?.results.length) return <div className="productGrid">{result.results.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}</div>;
  if (finished) return <div className="emptyState"><b>محصولی پیدا نشد</b><p>فیلترها را کمی بازتر کنید یا عبارت دیگری بنویسید.</p><a className="button primary" href="/shop">نمایش همه محصولات</a></div>;
  return <div className="catalogRecovery" role="status"><b>در حال آماده‌کردن محصولات…</b><p>اگر سرویس در خواب باشد، کالاها تا چند لحظه دیگر خودکار نمایش داده می‌شوند.</p><div className="recoverySkeleton" aria-hidden="true">{[0, 1, 2, 3].map(item => <i key={item} />)}</div></div>;
}
