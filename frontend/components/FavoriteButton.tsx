"use client";

import { Heart, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { notify } from "../lib/notify";
import { getWishlist, setWishlistProduct } from "../lib/wishlist";

export default function FavoriteButton({ productId, productSlug, className = "favoriteButton" }: { productId: number; productSlug: string; className?: string }) {
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    getWishlist(token).then(entries => setSaved(entries.some(entry => entry.product === productId))).catch(() => undefined);
    function sync(event: Event) {
      const detail = (event as CustomEvent<{ productId: number; saved: boolean }>).detail;
      if (detail?.productId === productId) setSaved(detail.saved);
    }
    window.addEventListener("janebi:wishlist-updated", sync);
    return () => window.removeEventListener("janebi:wishlist-updated", sync);
  }, [productId]);

  async function toggle() {
    const token = localStorage.getItem("access_token");
    if (!token) { location.href = `/login?next=/product/${productSlug}`; return; }
    const next = !saved;
    setSaved(next); setLoading(true);
    try {
      await setWishlistProduct(token, productId, next);
      notify(next ? "محصول به علاقه‌مندی‌ها اضافه شد." : "محصول از علاقه‌مندی‌ها حذف شد.", "favorite");
    } catch {
      setSaved(!next);
      notify("تغییر علاقه‌مندی انجام نشد؛ دوباره تلاش کنید.", "error");
    } finally { setLoading(false); }
  }

  return <button type="button" className={`${className} ${saved ? "active" : ""}`} onClick={toggle} disabled={loading} aria-pressed={saved} aria-label={saved ? "حذف از علاقه‌مندی‌ها" : "افزودن به علاقه‌مندی‌ها"}>
    {loading ? <LoaderCircle className="spin" /> : <Heart fill={saved ? "currentColor" : "none"} />}
  </button>;
}
