import SiteChrome from "../components/SiteChrome";
import ProductSection from "../components/ProductSection";
import HeroSlider from "../components/HeroSlider";
import HomeProductRecovery from "../components/HomeProductRecovery";
import FlashSaleSection from "../components/FlashSaleSection";
import BrandSection from "../components/BrandSection";
import { getBrands, getCategories, getHome, getStoreConfiguration, listOf } from "../lib/api";
import { BatteryCharging, Cable, Gamepad2, Headphones, Headset, RotateCcw, ShieldCheck, Smartphone, Sparkles, Watch, Zap } from "lucide-react";

const categoryIcons = [Headphones, Cable, Watch, Smartphone, BatteryCharging, Headset, Gamepad2, Sparkles];

export default async function Home() {
  const [home, catsRaw, brandsRaw, configuration] = await Promise.all([getHome(), getCategories(), getBrands(), getStoreConfiguration()]);
  const categories = listOf(catsRaw).slice(0, 8); const brands = listOf(brandsRaw);
  const heroProducts = [...home.offers, ...home.best_sellers, ...home.new].filter((p, index, all) => all.findIndex(x => x.id === p.id) === index && p.primary_image).slice(0, 4);
  const offers = home.offers.slice(0, 4);
  const hasHomeProducts = home.best_sellers.length > 0 || home.new.length > 0;
  return <SiteChrome><main className="homePage">
    <HeroSlider products={heroProducts}/>
    <section className="quickCategories shell"><a href="/shop" className="quickCategory all"><span><Sparkles /></span><b>مشاهده همه</b></a>{categories.map((c,index)=>{const Icon=categoryIcons[index % categoryIcons.length];return <a href={`/category/${c.slug}`} className="quickCategory" key={c.id}><span><Icon /></span><b>{c.name}</b></a>})}</section>
    <section className="serviceStrip shell"><div><span><Headset /></span><p><b>پشتیبانی پاسخ‌گو</b><small>{configuration.support_hours}</small></p></div><div><span><Zap /></span><p><b>ارسال سریع</b><small>ارسال به سراسر کشور</small></p></div><div><span><RotateCcw /></span><p><b>{configuration.return_days.toLocaleString("fa-IR")} روز مهلت درخواست بازگشت</b><small>طبق شرایط بازگشت کالا</small></p></div><div><span><ShieldCheck /></span><p><b>ضمانت اصالت کالا</b><small>تضمین اصالت و کیفیت محصولات</small></p></div></section>
    {!hasHomeProducts && <HomeProductRecovery />}
    <FlashSaleSection products={offers} configuration={configuration} />
    <BrandSection brands={brands} />
    <ProductSection kicker="محبوب‌ترین انتخاب کاربران" title="پرفروش‌ترین محصولات" products={home.best_sellers}/>
    <ProductSection kicker="همین حالا اضافه شده" title="جدیدترین محصولات" products={home.new}/>
    <section className="newsletter shell"><div><span>باشگاه مشتریان جانِبی</span><h2>از تخفیف‌های خاص جا نمان</h2><p>فقط خبرهای خوب و پیشنهادهای واقعی را برایت می‌فرستیم.</p></div><form><input aria-label="شماره موبایل" placeholder="شماره موبایل شما"/><button className="button primary">عضویت</button></form></section>
  </main></SiteChrome>;
}
