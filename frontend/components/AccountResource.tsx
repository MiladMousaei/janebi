"use client";

import { FormEvent, useEffect, useState } from "react";
import { Heart, MapPinned, Plus } from "lucide-react";
import { API_URL } from "../lib/api";
import { notify } from "../lib/notify";
import { getWishlist, invalidateWishlist, type WishlistEntry } from "../lib/wishlist";
import ProductCard from "./ProductCard";
import AccountShell from "./AccountShell";

type Address = { id: number; recipient_name: string; phone: string; province: string; city: string; address: string; postal_code: string; plaque: string; unit: string; is_default: boolean };

export default function AccountResource({ kind }: { kind: "addresses" | "wishlist" }) {
  const [items, setItems] = useState<Address[] | WishlistEntry[]>([]);
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  async function load(force = false) {
    if (!token) return;
    if (kind === "wishlist") { setItems(await getWishlist(token, force)); return; }
    const response = await fetch(`${API_URL}/auth/addresses/`, { headers: { Authorization: `Bearer ${token}` } });
    const body = await response.json(); setItems(body.results || body);
  }
  // Loading is intentionally client-only because authentication is stored in localStorage.
  // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
  useEffect(() => { void load(); }, []);
  async function remove(id: number) {
    const response = await fetch(`${API_URL}/${kind === "addresses" ? `auth/addresses/${id}/` : `wishlist/${id}/remove/`}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok && response.status !== 204) { notify("حذف مورد انجام نشد.", "error"); return; }
    if (kind === "wishlist") invalidateWishlist();
    notify(kind === "addresses" ? "آدرس حذف شد." : "محصول از علاقه‌مندی‌ها حذف شد.", kind === "addresses" ? "info" : "favorite");
    await load(true);
  }
  async function addAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const data = Object.fromEntries(new FormData(form));
    const response = await fetch(`${API_URL}/auth/addresses/`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ ...data, is_default: true }) });
    if (response.ok) { form.reset(); notify("آدرس جدید با موفقیت ذخیره شد."); await load(); }
    else notify("ذخیره آدرس انجام نشد؛ اطلاعات را بررسی کنید.", "error");
  }
  if (kind === "wishlist") return <AccountShell><div className="accountSectionHead"><div><span>انتخاب‌های شما</span><h1>علاقه‌مندی‌ها</h1></div><Heart /></div>{(items as WishlistEntry[]).length ? <div className="productGrid accountProductGrid">{(items as WishlistEntry[]).map(item => <div key={item.id} className="wishWrap"><ProductCard product={item.product_detail} /><button onClick={() => remove(item.id)}>حذف از علاقه‌مندی</button></div>)}</div> : <div className="emptyState"><b>لیست علاقه‌مندی خالی است</b><a className="button primary" href="/shop">مشاهده محصولات</a></div>}</AccountShell>;
  return <AccountShell><div className="accountSectionHead"><div><span>ارسال سریع‌تر</span><h1>آدرس‌های من</h1></div><MapPinned /></div><div className="addressGrid">{(items as Address[]).map(address => <article key={address.id}><div><b>{address.recipient_name}</b>{address.is_default && <span>پیش‌فرض</span>}</div><p>{address.province}، {address.city}، {address.address}، پلاک {address.plaque}</p><small>{address.phone} · {address.postal_code}</small><button onClick={() => remove(address.id)}>حذف آدرس</button></article>)}</div><form className="addressForm accountFormCard" onSubmit={addAddress}><div className="inlineFormTitle"><Plus /><div><b>افزودن آدرس جدید</b><small>برای تکمیل سریع‌تر خریدهای بعدی</small></div></div><div className="twoCols"><input name="recipient_name" placeholder="نام گیرنده" required /><input name="phone" placeholder="موبایل" required /><input name="province" placeholder="استان" required /><input name="city" placeholder="شهر" required /><input name="postal_code" placeholder="کد پستی" required /><input name="plaque" placeholder="پلاک" required /><input name="unit" placeholder="واحد" /></div><textarea name="address" placeholder="نشانی کامل" required /><button className="button primary">ذخیره آدرس</button></form></AccountShell>;
}
