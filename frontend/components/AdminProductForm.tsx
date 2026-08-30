"use client";

import { ImageIcon, UploadCloud } from "lucide-react";
import { ChangeEvent, FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { API_URL } from "../lib/api";
import type { Brand, Category, Paginated, Product } from "../lib/types";

function productImage(product: Product | null) {
  return product?.images?.find(item => item.is_primary)?.url
    || product?.images?.find(item => item.is_primary)?.external_url
    || product?.images?.[0]?.url
    || product?.images?.[0]?.external_url
    || product?.primary_image
    || "";
}

export default function AdminProductForm({ productId }: { productId?: string }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(Boolean(productId));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [preview, setPreview] = useState("");
  const [fileName, setFileName] = useState("");
  const objectUrl = useRef("");
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  const load = useCallback(async () => {
    const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
    const [categoryResponse, brandResponse] = await Promise.all([
      fetch(`${API_URL}/categories/?page_size=60`, { headers }).then(response => response.json()),
      fetch(`${API_URL}/brands/?page_size=60`, { headers }).then(response => response.json()),
    ]);
    setCategories(categoryResponse.results || categoryResponse);
    setBrands(brandResponse.results || brandResponse);
    if (productId) {
      const listData = await fetch(`${API_URL}/products/?page_size=100`, { headers }).then(response => response.json()) as Paginated<Product> | Product[];
      const items = Array.isArray(listData) ? listData : listData.results;
      const found = items.find(item => String(item.id) === String(productId));
      if (found) {
        const detail = await fetch(`${API_URL}/products/${found.slug}/`, { headers }).then(response => response.json()) as Product;
        const image = productImage(detail);
        setProduct(detail);
        setImageUrl(image.startsWith("http") ? image : "");
        setPreview(image);
      } else setMsg("محصول پیدا نشد.");
    }
    setLoading(false);
  }, [productId, token]);

  // Product data is loaded after the browser-only admin token becomes available.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);
  useEffect(() => () => { if (objectUrl.current) URL.revokeObjectURL(objectUrl.current); }, []);

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      event.target.value = "";
      setMsg("فرمت تصویر باید JPG، PNG یا WebP باشد.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      event.target.value = "";
      setMsg("حجم تصویر نباید بیشتر از ۵ مگابایت باشد.");
      return;
    }
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    objectUrl.current = URL.createObjectURL(file);
    setFileName(file.name);
    setPreview(objectUrl.current);
    setMsg("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMsg("");
    const form = event.currentTarget;
    const data = new FormData(form);
    ["is_active", "is_featured", "is_new"].forEach(name => {
      const input = form.elements.namedItem(name) as HTMLInputElement;
      data.set(name, input.checked ? "true" : "false");
    });
    if (!data.get("compare_at_price")) data.delete("compare_at_price");
    const chosenImage = data.get("primary_image_file");
    if (!(chosenImage instanceof File) || !chosenImage.size) data.delete("primary_image_file");
    data.set("primary_image_url", imageUrl);
    data.set("variant_sku", String(data.get("variant_sku") || `${data.get("sku")}-DEFAULT`));
    data.set("variant_stock", String(data.get("variant_stock") || 0));

    const url = product ? `${API_URL}/products/${product.slug}/` : `${API_URL}/products/`;
    const response = await fetch(url, {
      method: product ? "PATCH" : "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: data,
    });
    if (response.ok) {
      const saved = await response.json();
      setMsg("تغییرات با موفقیت ذخیره شد ✓");
      if (!product) setTimeout(() => { location.href = `/admin/products/${saved.id}`; }, 600);
      else await load();
    } else {
      const error = await response.json().catch(() => ({}));
      setMsg(Object.values(error).flat().join("، ") || "ذخیره محصول ممکن نشد.");
    }
    setSaving(false);
  }

  if (loading) return <div className="adminSkeleton" />;
  const variant = product?.variants?.[0];

  return <form className="adminProductForm" onSubmit={submit}>
    {msg && <div className={msg.includes("✓") ? "toastInline" : "formError"}>{msg}</div>}
    <div className="productFormGrid">
      <div className="productFormMain">
        <section>
          <div className="formSectionHead"><span>۱</span><div><h2>اطلاعات اصلی محصول</h2><p>عنوان و توضیحاتی که مشتری در فروشگاه می‌بیند</p></div></div>
          <label>نام محصول<input name="name" defaultValue={product?.name} required /></label>
          <div className="twoCols"><label>Slug<input name="slug" defaultValue={product?.slug} required dir="ltr" /></label><label>SKU محصول<input name="sku" defaultValue={product?.sku} required dir="ltr" /></label></div>
          <label>توضیح کوتاه<input name="short_description" defaultValue={product?.short_description} /></label>
          <label>توضیحات کامل<textarea name="description" defaultValue={product?.description} required /></label>
        </section>
        <section>
          <div className="formSectionHead"><span>۲</span><div><h2>قیمت و موجودی</h2><p>قیمت‌ها به تومان وارد می‌شوند</p></div></div>
          <div className="twoCols"><label>قیمت فروش<input name="base_price" type="number" defaultValue={product?.base_price} required /></label><label>قیمت قبل از تخفیف<input name="compare_at_price" type="number" defaultValue={product?.compare_at_price || ""} /></label><label>SKU تنوع اصلی<input name="variant_sku" defaultValue={variant?.sku || ""} dir="ltr" /></label><label>موجودی اولیه<input name="variant_stock" type="number" min="0" defaultValue={variant?.stock || 0} /></label></div>
        </section>
        <section>
          <div className="formSectionHead"><span>۳</span><div><h2>تصویر و سئو</h2><p>تصویر را از حافظه دستگاه انتخاب کنید یا لینک مستقیم وارد کنید</p></div></div>
          <div className="imageSourceGrid">
            <label>آدرس تصویر اصلی<input name="primary_image_url" value={imageUrl} onChange={event => { setImageUrl(event.target.value); if (!fileName) setPreview(event.target.value); }} type="url" dir="ltr" placeholder="https://..." /></label>
            <label className="imageUploadButton"><UploadCloud aria-hidden="true" /><span><b>بارگذاری از حافظه</b><small>{fileName || "JPG، PNG یا WebP تا ۵ مگابایت"}</small></span><input className="srOnly" name="primary_image_file" type="file" accept="image/jpeg,image/png,image/webp" onChange={chooseFile} /></label>
          </div>
          {preview ? <div className="adminImagePreview"><img src={preview} alt="پیش‌نمایش محصول" /></div> : <div className="adminImageEmpty"><ImageIcon aria-hidden="true" /><span>هنوز تصویری انتخاب نشده است</span></div>}
          <div className="twoCols"><label>عنوان SEO<input name="seo_title" defaultValue={product?.seo_title} /></label><label>توضیح SEO<input name="seo_description" defaultValue={product?.seo_description} /></label></div>
        </section>
      </div>
      <aside className="productFormSide">
        <section><h3>انتشار</h3><label className="adminCheck" htmlFor="product-active" aria-label="نمایش محصول در فروشگاه"><input id="product-active" name="is_active" type="checkbox" defaultChecked={product?.is_active ?? true} aria-label="نمایش محصول در فروشگاه" /><span></span><div><b>نمایش در فروشگاه</b><small>محصول برای مشتریان فعال باشد</small></div></label><label className="adminCheck" htmlFor="product-new" aria-label="محصول جدید"><input id="product-new" name="is_new" type="checkbox" defaultChecked={product?.is_new ?? true} aria-label="محصول جدید" /><span></span><div><b>محصول جدید</b><small>برچسب جدید نمایش داده شود</small></div></label><label className="adminCheck" htmlFor="product-featured" aria-label="محصول ویژه"><input id="product-featured" name="is_featured" type="checkbox" defaultChecked={product?.is_featured ?? false} aria-label="محصول ویژه" /><span></span><div><b>محصول ویژه</b><small>در پیشنهادهای اصلی نمایش داده شود</small></div></label></section>
        <section><h3>طبقه‌بندی</h3><label>دسته‌بندی<select name="category" defaultValue={product?.category.id} required>{categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label>برند<select name="brand" defaultValue={product?.brand.id} required>{brands.map(brand => <option key={brand.id} value={brand.id}>{brand.name}</option>)}</select></label></section>
        <button className="button primary saveProduct" disabled={saving}>{saving ? "در حال ذخیره..." : product ? "ذخیره تغییرات" : "ایجاد محصول"}</button>
      </aside>
    </div>
  </form>;
}
