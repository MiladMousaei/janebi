"use client";

import { ShoppingBag, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { API_URL, formatPrice } from "../lib/api";
import { announceCartChange, notify } from "../lib/notify";

type Cart = { items: { id: number; quantity: number; unit_price: number; total_price: number; product_detail: { name: string; slug: string; primary_image: string | null }; variant_detail: { attributes: { attribute_name: string; value: string }[] } }[]; subtotal: number; item_count: number };
export default function CartClient() {
  const [cart, setCart] = useState<Cart | null>(null); const [loading, setLoading] = useState(true);
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  async function load() { if (!token) { setLoading(false); return; } const response = await fetch(`${API_URL}/cart/`, { headers: { Authorization: `Bearer ${token}` } }); if (response.ok) setCart(await response.json()); setLoading(false); }
  // Loading is intentionally client-only because authentication is stored in localStorage.
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { void load(); }, []);
  async function update(id: number, quantity?: number) {
    const response = await fetch(`${API_URL}/cart/${id}/item/`, { method: quantity ? "PATCH" : "DELETE", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: quantity ? JSON.stringify({ quantity }) : undefined });
    if (!response.ok && response.status !== 204) { notify("به‌روزرسانی سبد انجام نشد؛ موجودی محصول را بررسی کنید.", "error"); return; }
    if (response.status === 204) { await load(); notify("محصول از سبد خرید حذف شد.", "info"); }
    else setCart(await response.json());
    announceCartChange();
  }
  if (loading) return <div className="skeletonBox" />;
  if (!token) return <div className="emptyState"><b>برای دیدن سبد وارد شوید</b><a className="button primary" href="/login?next=/cart">ورود به حساب</a></div>;
  if (!cart?.items.length) return <div className="emptyState"><ShoppingBag /><b>سبد خرید شما خالی است</b><p>محصولات جذاب زیادی منتظر شماست.</p><a className="button primary" href="/shop">شروع خرید</a></div>;
  return <div className="cartLayout"><section className="cartItems">{cart.items.map(item => <article className="cartItem" key={item.id}><div className="cartThumb">{item.product_detail.primary_image ? <img src={item.product_detail.primary_image} alt="" /> : <ShoppingBag />}</div><div><a href={`/product/${item.product_detail.slug}`}><b>{item.product_detail.name}</b></a><p>{item.variant_detail.attributes.map(attribute => `${attribute.attribute_name}: ${attribute.value}`).join("، ")}</p><strong>{formatPrice(item.unit_price)}</strong></div><div className="quantity"><button aria-label="کاهش تعداد" onClick={() => update(item.id, Math.max(1, item.quantity - 1))}>−</button><span>{item.quantity.toLocaleString("fa-IR")}</span><button aria-label="افزایش تعداد" onClick={() => update(item.id, item.quantity + 1)}>＋</button></div><button className="remove" onClick={() => update(item.id)}><Trash2 /> حذف</button></article>)}</section><aside className="orderSummary"><h2>خلاصه سفارش</h2><div><span>تعداد کالا</span><b>{cart.item_count.toLocaleString("fa-IR")}</b></div><div><span>جمع سبد</span><b>{formatPrice(cart.subtotal)}</b></div><div><span>هزینه ارسال</span><b>در مرحله بعد</b></div><hr /><div className="total"><span>مبلغ قابل پرداخت</span><b>{formatPrice(cart.subtotal)}</b></div><a className="button primary" href="/checkout">ادامه فرایند خرید</a></aside></div>;
}
