"use client";

import { ShoppingBag } from "lucide-react";
import { useMemo, useState } from "react";
import { API_URL, formatPrice } from "../lib/api";
import { announceCartChange, notify } from "../lib/notify";
import type { Product } from "../lib/types";
import FavoriteButton from "./FavoriteButton";

export default function ProductPurchase({ product }: { product: Product }) {
  const available = product.variants?.filter(variant => variant.stock > 0) || [];
  const [variantId, setVariantId] = useState(available[0]?.id || 0);
  const [quantity, setQuantity] = useState(1);
  const variant = useMemo(() => product.variants?.find(item => item.id === variantId), [variantId, product]);
  async function add(buy = false) {
    const token = localStorage.getItem("access_token");
    if (!token) { location.href = `/login?next=/product/${product.slug}`; return; }
    try {
      const response = await fetch(`${API_URL}/cart/add/`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ product: product.id, variant: variantId, quantity }) });
      if (!response.ok) throw new Error();
      announceCartChange(); notify(`${quantity.toLocaleString("fa-IR")} عدد از این محصول به سبد اضافه شد.`);
      if (buy) location.href = "/cart";
    } catch { notify("امکان افزودن محصول وجود ندارد؛ موجودی را بررسی کنید.", "error"); }
  }
  return <div className="purchase"><div className="priceLine"><strong>{formatPrice(variant?.effective_price || product.base_price)}</strong>{product.compare_at_price && <del>{formatPrice(product.compare_at_price)}</del>}</div><p className={available.length ? "inStock" : "outStock"}>{available.length ? `موجود در انبار (${variant?.stock || 0} عدد)` : "ناموجود"}</p>{available.length > 0 && <><label>انتخاب تنوع<select value={variantId} onChange={event => setVariantId(Number(event.target.value))}>{available.map(item => <option key={item.id} value={item.id}>{item.attributes.map(attribute => `${attribute.attribute_name}: ${attribute.value}`).join(" - ")} | {item.sku}</option>)}</select></label><div className="quantity"><button aria-label="کاهش تعداد" onClick={() => setQuantity(Math.max(1, quantity - 1))}>−</button><span>{quantity.toLocaleString("fa-IR")}</span><button aria-label="افزایش تعداد" onClick={() => setQuantity(Math.min(variant?.stock || 1, quantity + 1))}>＋</button></div><div className="purchaseButtons"><button className="button primary" onClick={() => add(false)}><ShoppingBag /> افزودن به سبد خرید</button><button className="button ghost" onClick={() => add(true)}>خرید فوری</button><FavoriteButton productId={product.id} productSlug={product.slug} className="purchaseFavorite" /></div></>}</div>;
}
