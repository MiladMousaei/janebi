"use client";
import { useEffect, useState } from "react";
import SearchBox from "./SearchBox";
import { API_URL } from "../lib/api";

export default function SiteHeader() {
  const [cartCount, setCartCount] = useState(0);
  useEffect(() => { const token = localStorage.getItem("access_token"); if (!token) return; fetch(`${API_URL}/cart/`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json() : null).then(data => data && setCartCount(data.item_count)); }, []);
  return <><div className="announcement"><div className="shell"><span>● ارسال سریع به سراسر ایران</span><span>ضمانت اصالت کالا</span><span>۷ روز امکان بازگشت</span></div></div><header className="header shell"><a className="brand" href="/"><span className="brandMark">ج</span><span><b>جانِبی</b><small>فروشگاه گجت</small></span></a><SearchBox/><nav className="actions" aria-label="دسترسی سریع"><a href="/account/wishlist"><span>♡</span><small>علاقه‌مندی</small></a><a href="/account"><span>◯</span><small>حساب من</small></a><a className="cartAction" href="/cart"><span>▢</span><small>سبد خرید</small>{cartCount > 0 && <b>{cartCount}</b>}</a></nav></header><div className="navWrap"><nav className="shell nav"><a className="allCategories" href="/shop">☰ همه دسته‌بندی‌ها</a><a href="/">خانه</a><a href="/shop?ordering=-created_at">جدیدترین‌ها</a><a href="/shop?discount=true">فروش ویژه <i>Hot</i></a><a href="/shop?ordering=-sold_count">پرفروش‌ها</a><a href="/faq">راهنمای خرید</a><a href="/contact">تماس با ما</a><span className="navSupport">پشتیبانی: ۰۲۱-۹۱۰۰۱۲۳۴</span></nav></div></>;
}
