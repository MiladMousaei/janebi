"use client";

import { CircleUserRound, Headphones, Heart, Menu, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import SearchBox from "./SearchBox";
import { API_URL } from "../lib/api";
import NotificationCenter from "./NotificationCenter";

export default function SiteHeader() {
  const [cartCount, setCartCount] = useState(0);
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    fetch(`${API_URL}/cart/`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null).then(data => data && setCartCount(data.item_count));
  }, []);
  return <>
    <div className="announcement"><div className="shell">
      <span><Truck size={15} /> ارسال سریع به سراسر ایران</span>
      <span><ShieldCheck size={15} /> ضمانت اصالت کالا</span>
      <span><Headphones size={15} /> پشتیبانی واقعی</span>
    </div></div>
    <header className="header shell">
      <Link className="brand" href="/"><span className="brandMark">ج</span><span><b>جانِبی</b><small>فروشگاه گجت</small></span></Link>
      <SearchBox />
      <nav className="actions" aria-label="دسترسی سریع">
        <NotificationCenter />
        <a href="/account/wishlist" aria-label="علاقه‌مندی‌ها"><Heart aria-hidden="true" /><small>علاقه‌مندی</small></a>
        <a href="/account" aria-label="حساب من"><CircleUserRound aria-hidden="true" /><small>حساب من</small></a>
        <a className="cartAction" href="/cart" aria-label={`سبد خرید، ${cartCount} کالا`}><ShoppingBag aria-hidden="true" /><small>سبد خرید</small>{cartCount > 0 && <b>{cartCount}</b>}</a>
      </nav>
    </header>
    <div className="navWrap"><nav className="shell nav">
      <a className="allCategories" href="/shop"><Menu size={18} /> همه دسته‌بندی‌ها</a>
      <Link href="/">خانه</Link><a href="/shop?ordering=-created_at">جدیدترین‌ها</a><a href="/shop?discount=true">فروش ویژه <i>Hot</i></a><a href="/shop?ordering=-sold_count">پرفروش‌ها</a><a href="/faq">راهنمای خرید</a><a href="/contact">تماس با ما</a><span className="navSupport">پشتیبانی: ۰۲۱-۹۱۰۰۱۲۳۴</span>
    </nav></div>
  </>;
}
