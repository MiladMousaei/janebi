import type { Metadata } from "next";
import ProductPurchase from "../../../components/ProductPurchase";
import ProductSection from "../../../components/ProductSection";
import ProductVisual from "../../../components/ProductVisual";
import ReviewForm from "../../../components/ReviewForm";
import SiteChrome from "../../../components/SiteChrome";
import { safeFetch } from "../../../lib/api";
import type { Product } from "../../../lib/types";

async function getProduct(slug: string) { return safeFetch<Product | null>(`/products/${encodeURIComponent(slug)}/`, null); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "محصول پیدا نشد | جانبی" };
  const socialImages = product.primary_image ? [product.primary_image] : [];
  return {
    title: product.seo_title || `${product.name} | جانبی`, description: product.short_description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: { title: product.name, description: product.short_description, images: socialImages },
    twitter: { title: product.name, description: product.short_description, images: socialImages },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return <SiteChrome><div className="emptyState standalone"><b>محصول پیدا نشد</b><a className="button primary" href="/shop">بازگشت به فروشگاه</a></div></SiteChrome>;
  const seededSample = /^product-\d+$/.test(product.slug);
  const productSchema = { "@context": "https://schema.org", "@type": "Product", name: product.name, description: product.short_description, sku: product.sku, brand: { "@type": "Brand", name: product.brand.name }, offers: { "@type": "Offer", priceCurrency: "IRR", price: product.base_price * 10, availability: product.total_stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock", url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/product/${product.slug}` } };
  return <SiteChrome><main className="shell productPage"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema).replace(/</g, "\\u003c") }} />
    <div className="breadcrumbs">خانه / {product.category.name} / {product.name}</div>
    <section className="productHero">
      <div className="gallery">
        <div className="mainImage"><ProductVisual name={product.name} slug={product.slug} image={product.primary_image} /></div>
        {!seededSample && <div className="thumbs">{product.images?.filter(image => image.url).map(image => <ProductVisual key={image.id} name={product.name} slug={product.slug} image={image.url} />)}</div>}
      </div>
      <div className="details"><span className="eyebrow">{product.brand.name}</span><h1>{product.name}</h1><div className="rating">★★★★★ <span>{product.average_rating} از ۵ · {product.reviews?.length || 0} نظر</span></div><p>{product.short_description}</p><div className="sku">کد کالا: {product.variants?.[0]?.sku}</div><ProductPurchase product={product} /><div className="guarantees"><span>✓ تضمین اصالت</span><span>✓ بازگشت طبق قوانین</span><span>✓ ارسال سریع</span></div></div>
    </section>
    <section className="productTabs"><h2>توضیحات محصول</h2><p>{product.description}</p><h3>مشخصات فنی</h3><div className="specs">{Object.entries(product.specifications || {}).map(([key, value]) => <div key={key}><span>{key}</span><b>{value}</b></div>)}</div><h3>نظر خریداران</h3>{product.reviews?.length ? product.reviews.map(review => <article className="review" key={review.id}><b>{review.title}</b><span>{"★".repeat(review.rating)} · {review.user_name}</span><p>{review.comment}</p></article>) : <p className="muted">هنوز نظری ثبت نشده است.</p>}<ReviewForm productId={product.id} productSlug={product.slug} /></section>
    <ProductSection title="محصولات مشابه" kicker="شاید بپسندید" products={product.related || []} />
  </main></SiteChrome>;
}
