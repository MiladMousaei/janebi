import SiteChrome from "../components/SiteChrome";
import ProductSection from "../components/ProductSection";
import HeroSlider from "../components/HeroSlider";
import HomeProductRecovery from "../components/HomeProductRecovery";
import FlashSaleSection from "../components/FlashSaleSection";
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
    <section className="serviceStrip shell"><div><span><Headset /></span><p><b>پشتیبانی ۲۴/۷</b><small>پاسخگوی شما هستیم</small></p></div><div><span><Zap /></span><p><b>ارسال سریع</b><small>ارسال به سراسر کشور</small></p></div><div><span><RotateCcw /></span><p><b>۷ روز ضمانت بازگشت</b><small>بازگشت کالا بدون قید و شرط</small></p></div><div><span><ShieldCheck /></span><p><b>ضمانت اصالت کالا</b><small>تضمین اصالت و کیفیت محصولات</small></p></div></section>
    {!hasHomeProducts && <HomeProductRecovery />}
    <FlashSaleSection products={offers} configuration={configuration} />
    <section className="section shell categorySection"><div className="sectionHead"><div><span>انتخاب راحت‌تر</span><h2>دسته‌بندی‌های محبوب</h2></div><a href="/shop">مشاهده همه</a></div><div className="categoryGrid">{categories.map((c,index)=>{const Icon=categoryIcons[index % categoryIcons.length];return <a href={`/category/${c.slug}`} className="category visualCategory" key={c.id}><div>{c.cover_image?<img src={c.cover_image} alt=""/>:<span><Icon /></span>}</div><b>{c.name}</b><small>{c.product_count||0} محصول</small></a>})}</div></section>
    <ProductSection kicker="محبوب‌ترین انتخاب کاربران" title="پرفروش‌ترین محصولات" products={home.best_sellers}/>
    <ProductSection kicker="همین حالا اضافه شده" title="جدیدترین محصولات" products={home.new}/>
    <section className="brandsSection shell"><div className="sectionHead"><div><span>انتخاب مطمئن</span><h2>برندهای معتبر</h2></div><a href="/shop">مشاهده همه</a></div><div className="brandGrid">{brands.slice(0,7).map(brand=><a className={`brandTile brand-${brand.slug.replace(/[^a-z0-9]/gi,"").toLowerCase()}`} href={`/shop?brand=${brand.slug}`} key={brand.id}>{brand.logo?<img src={brand.logo} alt={`لوگوی ${brand.name}`}/>:<><span>{brand.name.slice(0,2)}</span><b>{brand.name}</b></>}</a>)}</div></section>
    <section className="newsletter shell"><div><span>باشگاه مشتریان جانِبی</span><h2>از تخفیف‌های خاص جا نمان</h2><p>فقط خبرهای خوب و پیشنهادهای واقعی را برایت می‌فرستیم.</p></div><form><input aria-label="شماره موبایل" placeholder="شماره موبایل شما"/><button className="button primary">عضویت</button></form></section>
  </main></SiteChrome>;
}
