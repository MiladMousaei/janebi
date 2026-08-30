"use client";

import { ShoppingBag, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { API_URL, formatPrice } from "../lib/api";
import { announceCartChange, notify } from "../lib/notify";
import ProductVisual from "./ProductVisual";
import { readGuestCart, updateGuestItem } from "../lib/guestCart";

type Cart = { items: { id: number; quantity: number; unit_price: number; total_price: number; product_detail: { name: string; slug: string; primary_image: string | null }; variant_detail: { attributes: { attribute_name: string; value: string }[] } }[]; subtotal: number; item_count: number };

export default function CartClient() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  async function load() {
    if (!token) {
      const items = readGuestCart().map(item => ({ id: item.id, quantity: item.quantity, unit_price: item.variant.effective_price || item.product.base_price, total_price: (item.variant.effective_price || item.product.base_price) * item.quantity, product_detail: item.product, variant_detail: { attributes: item.variant.attributes } }));
      setCart({ items, subtotal: items.reduce((sum, item) => sum + item.total_price, 0), item_count: items.reduce((sum, item) => sum + item.quantity, 0) });
      setLoading(false); return;
    }
    const response = await fetch(`${API_URL}/cart/`, { headers: { Authorization: `Bearer ${token}` } });
    if (response.ok) setCart(await response.json());
    setLoading(false);
  }
  // Authentication is stored client-side.
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { void load(); }, []);

  async function update(id: number, quantity?: number) {
    if (!token) {
      updateGuestItem(id, quantity);
      await load();
      notify(quantity === undefined ? "محصول از سبد خرید حذف شد." : "سبد خرید به‌روز شد.", quantity === undefined ? "info" : "success");
      return;
    }
    const response = await fetch(`${API_URL}/cart/${id}/item/`, { method: quantity ? "PATCH" : "DELETE", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: quantity ? JSON.stringify({ quantity }) : undefined });
    if (!response.ok && response.status !== 204) { notify("به‌روزرسانی سبد انجام نشد؛ موجودی محصول را بررسی کنید.", "error"); return; }
    if (response.status === 204) { await load(); notify("محصول از سبد خرید حذف شد.", "info"); }
    else setCart(await response.json());
    announceCartChange();
  }

  if (loading) return <div className="skeletonBox" />;
  if (!cart?.items.length) return <div className="emptyState"><ShoppingBag /><b>سبد خرید شما خالی است</b><p>محصولات جذاب زیادی منتظر شماست.</p><a className="button primary" href="/shop">شروع خرید</a></div>;

  return <div className="cartLayout"><section className="cartItems">{cart.items.map(item => <article className="cartItem" key={item.id}>
    <div className="cartThumb"><ProductVisual name={item.product_detail.name} slug={item.product_detail.slug} image={item.product_detail.primary_image} /></div>
    <div><a href={`/product/${item.product_detail.slug}`}><b>{item.product_detail.name}</b></a><p>{item.variant_detail.attributes.map(attribute => `${attribute.attribute_name}: ${attribute.value}`).join("، ")}</p><strong>{formatPrice(item.unit_price)}</strong></div>
    <div className="quantity"><button aria-label="کاهش تعداد" onClick={() => update(item.id, Math.max(1, item.quantity - 1))}>−</button><span>{item.quantity.toLocaleString("fa-IR")}</span><button aria-label="افزایش تعداد" onClick={() => update(item.id, item.quantity + 1)}>＋</button></div>
    <button className="remove" aria-label={`حذف ${item.product_detail.name} از سبد خرید`} onClick={() => update(item.id)}><Trash2 aria-hidden="true" /><span>حذف</span></button>
  </article>)}</section><aside className="orderSummary"><h2>خلاصه سفارش</h2>{!token && <p className="guestCartNote">سبد شما ذخیره شده است؛ برای تکمیل خرید وارد حساب شوید.</p>}<div><span>تعداد کالا</span><b>{cart.item_count.toLocaleString("fa-IR")}</b></div><div><span>جمع سبد</span><b>{formatPrice(cart.subtotal)}</b></div><div><span>هزینه ارسال</span><b>در مرحله بعد</b></div><hr /><div className="total"><span>مبلغ قابل پرداخت</span><b>{formatPrice(cart.subtotal)}</b></div><a className="button primary" href={token ? "/checkout" : "/login?next=/checkout"}>{token ? "ادامه فرایند خرید" : "ورود و ادامه خرید"}</a></aside></div>;
}
