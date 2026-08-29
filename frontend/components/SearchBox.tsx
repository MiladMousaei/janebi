"use client";

import { Search, X } from "lucide-react";
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL, formatPrice } from "../lib/api";
import type { Paginated, Product } from "../lib/types";
import ProductVisual from "./ProductVisual";

export default function SearchBox() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => { const close = (event: MouseEvent) => { if (!box.current?.contains(event.target as Node)) setOpen(false); }; document.addEventListener("mousedown", close); return () => document.removeEventListener("mousedown", close); }, []);
  useEffect(() => {
    if (query.trim().length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`${API_URL}/products/?search=${encodeURIComponent(query.trim())}&page_size=5`, { signal: controller.signal });
        if (!response.ok) throw new Error();
        const data = await response.json() as Paginated<Product>;
        setResults(data.results); setOpen(true); setActive(-1);
      } catch { if (!controller.signal.aborted) setResults([]); }
    }, 280);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query]);

  function submit(event: FormEvent) { event.preventDefault(); if (active >= 0 && results[active]) router.push(`/product/${results[active].slug}`); else if (query.trim()) router.push(`/search?q=${encodeURIComponent(query.trim())}`); setOpen(false); }
  function keyboard(event: KeyboardEvent<HTMLInputElement>) { if (!open) return; if (event.key === "ArrowDown") { event.preventDefault(); setActive(value => Math.min(results.length - 1, value + 1)); } if (event.key === "ArrowUp") { event.preventDefault(); setActive(value => Math.max(-1, value - 1)); } if (event.key === "Escape") setOpen(false); }

  return <div className="searchWrap" ref={box}><form className="search" onSubmit={submit} role="search"><Search className="searchIcon" aria-hidden="true" /><input value={query} onFocus={() => results.length > 0 && setOpen(true)} onKeyDown={keyboard} onChange={event => { const value = event.target.value; setQuery(value); if (value.trim().length < 2) { setResults([]); setOpen(false); } }} aria-label="جستجوی محصولات" placeholder="جستجو بین محصولات، برندها و دسته‌ها…" />{query && <button type="button" className="clearSearch" aria-label="پاک‌کردن جستجو" onClick={() => { setQuery(""); setResults([]); setOpen(false); }}><X aria-hidden="true" /></button>}<kbd>Enter</kbd></form>{open && <div className="searchDropdown"><div className="suggestionHead"><span>پیشنهادهای جستجو</span><small>{results.length} نتیجه سریع</small></div>{results.length ? results.map((product, index) => <a className={active === index ? "active" : ""} key={product.id} href={`/product/${product.slug}`}><div className="suggestionImage"><ProductVisual name={product.name} slug={product.slug} image={product.primary_image} decorative /></div><div><b>{product.name}</b><small>{product.brand.name} · {product.category.name}</small></div><strong>{formatPrice(product.base_price)}</strong></a>) : <div className="noSuggestion">محصولی با این عبارت پیدا نشد.</div>}<button onClick={() => { router.push(`/search?q=${encodeURIComponent(query.trim())}`); setOpen(false); }}>مشاهده همه نتایج <span>←</span></button></div>}</div>;
}
