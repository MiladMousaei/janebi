import ProductCard from "./ProductCard";
import SiteChrome from "./SiteChrome";
import CatalogControls from "./CatalogControls";
import CatalogRecovery from "./CatalogRecovery";
import { ArrowLeft, BadgePercent, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { getBrands, getCategories, getStoreConfiguration, listOf, safeFetch } from "../lib/api";
import type { Paginated, Product } from "../lib/types";

type Params = Record<string, string | undefined>;
export default async function CatalogPage({ title, path = "/shop", params = {} }: { title: string; path?: string; params?: Params }) {
  const apiParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => value && apiParams.set(key, value));
  const [products, categoriesRaw, brandsRaw, configuration] = await Promise.all([
    safeFetch<Paginated<Product>>(`/products/?${apiParams}`, { count: 0, next: null, previous: null, results: [] }),
    getCategories(), getBrands(), getStoreConfiguration(),
  ]);
  const categories = listOf(categoriesRaw), brands = listOf(brandsRaw), page = Number(params.page || 1), pages = Math.max(1, Math.ceil(products.count / 12));
  const pageLink = (target: number) => { const next = new URLSearchParams(); Object.entries(params).forEach(([key, value]) => value && key !== "page" && next.set(key, value)); next.set("page", String(target)); return `${path}?${next}`; };
  const labels: Record<string, string> = { search: `جستجو: ${params.search || ""}`, category: categories.find(item => item.slug === params.category)?.name || "دسته‌بندی", brand: brands.find(item => item.slug === params.brand)?.name || "برند", min_price: `از ${new Intl.NumberFormat("fa-IR").format(Number(params.min_price || 0))}`, max_price: `تا ${new Intl.NumberFormat("fa-IR").format(Number(params.max_price || 0))}`, rating: `${params.rating}+ ستاره`, availability: "فقط موجودها", discount: "تخفیف‌دار" };
  const activeFilters = Object.keys(labels).filter(key => params[key]);
  const removeFilter = (target: string) => { const next = new URLSearchParams(); Object.entries(params).forEach(([key, value]) => value && key !== target && key !== "page" && next.set(key, value)); return `${path}?${next}`; };
  const isShop = path === "/shop";

  return <SiteChrome><main className="shell catalogPage">
    {isShop ? <section className="shopBanner"><div className="shopBannerGlow" /><div className="shopBannerCopy"><span><Sparkles /> فروشگاه جانِبی</span><h1>{configuration.shop_banner_title}</h1><p>{configuration.shop_banner_subtitle}</p><div className="shopBannerTrust"><b><ShieldCheck /> ضمانت اصالت</b><b><Truck /> ارسال سریع</b><b><BadgePercent /> پیشنهادهای واقعی</b></div><a href="#catalog-products">شروع انتخاب <ArrowLeft /></a></div><div className="shopBannerVisual" aria-hidden="true"><i /><i /><strong>{new Intl.NumberFormat("fa-IR").format(products.count)}<small>محصول منتخب</small></strong></div></section>
      : <div className="catalogTitle"><div><span>فروشگاه جانِبی</span><h1>{title}</h1><p><b>{new Intl.NumberFormat("fa-IR").format(products.count)}</b> کالا با امکان مقایسه و خرید امن</p></div><div className="catalogDecor" aria-hidden="true"><i /><i /><i /></div></div>}
    {activeFilters.length > 0 && <div className="activeFilters"><span>فیلترهای فعال:</span>{activeFilters.map(key => <a href={removeFilter(key)} key={key}>{labels[key]} <b>×</b></a>)}<a className="clearAll" href="/shop">پاک کردن همه</a></div>}
    <div className="catalogWorkspace" id="catalog-products"><CatalogControls path={path} params={params} categories={categories} brands={brands} /><section className="catalogResults"><div className="resultSummary"><span>نمایش {new Intl.NumberFormat("fa-IR").format(products.results.length)} کالا در این صفحه</span><small>صفحه {new Intl.NumberFormat("fa-IR").format(page)} از {new Intl.NumberFormat("fa-IR").format(pages)}</small></div>
      {products.results.length ? <div className="productGrid">{products.results.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}</div> : <CatalogRecovery query={apiParams.toString()} />}
      {products.results.length > 0 && <div className="pagination"><a className={page <= 1 ? "disabled" : ""} href={pageLink(Math.max(1, page - 1))}>→ قبلی</a><div>{Array.from({ length: Math.min(5, pages) }, (_, index) => Math.max(1, Math.min(Math.max(1, pages - 4), page - 2)) + index).filter(number => number <= pages).map(number => <a className={number === page ? "active" : ""} href={pageLink(number)} key={number}>{new Intl.NumberFormat("fa-IR").format(number)}</a>)}</div><a className={page >= pages ? "disabled" : ""} href={pageLink(Math.min(pages, page + 1))}>بعدی ←</a></div>}
    </section></div>
  </main></SiteChrome>;
}
