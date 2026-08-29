"use client";

import Link from "next/link";
import { ArrowLeft, PackageCheck, ShieldCheck, Sparkles, Zap } from "lucide-react";
import type { Product } from "../lib/types";

export default function HeroSlider({ products }: { products: Product[] }) {
  const featured = products[0];
  return <section className="premiumHero shell" aria-labelledby="hero-title">
    <div className="premiumHeroMedia" aria-hidden="true" />
    <div className="premiumHeroGlow" aria-hidden="true" />
    <div className="premiumHeroCopy">
      <span className="premiumHeroBadge"><Sparkles size={16} /> انتخاب هوشمند برای سبک زندگی دیجیتال</span>
      <h1 id="hero-title">تکنولوژی،<br /><em>هم‌قدمِ لحظه‌های تو</em></h1>
      <p>گجت‌ها و لوازم جانبی اصل را با انتخاب دقیق، ضمانت واقعی و ارسال سریع تجربه کن.</p>
      <div className="premiumHeroActions">
        <Link className="button heroPrimary" href="/shop">شروع خرید <ArrowLeft size={18} /></Link>
        {featured && <Link className="button heroSecondary" href={`/product/${featured.slug}`}>پیشنهاد امروز</Link>}
      </div>
      <div className="premiumHeroTrust">
        <span><ShieldCheck size={19} /><b>ضمانت اصالت</b></span>
        <span><Zap size={19} /><b>ارسال سریع</b></span>
        <span><PackageCheck size={19} /><b>بازگشت طبق قوانین</b></span>
      </div>
    </div>
  </section>;
}
