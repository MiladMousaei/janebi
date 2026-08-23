"use client";
import { useEffect, useState } from "react";
import type { Product } from "../lib/types";
import { formatPrice } from "../lib/api";

const accents = ["#3687ff", "#27c4a5", "#ff9b37", "#bd6cff"];

export default function HeroSlider({ products }: { products: Product[] }) {
  const slides = products.filter(product => product.primary_image).slice(0, 4);
  const [active, setActive] = useState(0); const [paused, setPaused] = useState(false);
  useEffect(() => { if (paused || slides.length < 2) return; const timer = setInterval(() => setActive(value => (value + 1) % slides.length), 5200); return () => clearInterval(timer); }, [paused, slides.length]);
  if (!slides.length) return null;
  const go = (direction: number) => setActive(value => (value + direction + slides.length) % slides.length);
  return <section className="heroSlider shell" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} aria-roledescription="carousel">
    <div className="slidesTrack" style={{ transform: `translateX(${active * 100}%)` }}>
      {slides.map((product, index) => <article className="heroSlide" key={product.id} aria-hidden={active !== index} style={{ "--accent": accents[index % accents.length] } as React.CSSProperties}>
        <div className="heroCopy"><span className="heroTag">{product.discount_percent ? `٪${product.discount_percent} تخفیف ویژه` : "منتخب این هفته"}</span><h1>{product.name}</h1><p>{product.short_description || "اصالت تضمین‌شده، ارسال سریع و خرید مطمئن از فروشگاه جانِبی"}</p><div className="heroPrice">{product.compare_at_price && <del>{formatPrice(product.compare_at_price)}</del>}<strong>{formatPrice(product.base_price)}</strong></div><div className="heroCtas"><a className="button light" href={`/product/${product.slug}`}>مشاهده محصول <b>←</b></a><a className="heroAllLink" href="/shop">همه محصولات</a></div></div>
        <div className="heroShowcase"><div className="heroSpotlight"></div><div className="productStage"></div><img className="slideProduct" src={product.primary_image!} alt={product.name}/><span className="orbit orbitOne"></span><span className="orbit orbitTwo"></span><div className="floatingSpec"><small>{product.brand.name}</small><b>{product.category.name}</b></div></div>
      </article>)}
    </div>
    {slides.length > 1 && <><button className="sliderArrow prev" onClick={() => go(-1)} aria-label="اسلاید قبلی">‹</button><button className="sliderArrow next" onClick={() => go(1)} aria-label="اسلاید بعدی">›</button><div className="sliderDots">{slides.map((product,index)=><button key={product.id} className={active === index ? "active" : ""} onClick={() => setActive(index)} aria-label={`نمایش اسلاید ${index + 1}`}/>)}</div></>}
  </section>;
}
