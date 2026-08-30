"use client";

import Link from "next/link";
import { Package, RefreshCw, Search, ShoppingBag, Trash2, TrendingUp, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { formatPrice } from "../lib/api";
import { authFetch } from "../lib/authFetch";
import type { Product } from "../lib/types";
import AdminShell from "./AdminShell";
import ProductVisual from "./ProductVisual";

type Stats = {
  revenue: number; revenue_today: number; orders: number; pending_orders: number; users: number;
  products: number; low_stock: number; out_of_stock: number;
  chart: { day: string; revenue: number; orders: number }[];
  recent_orders: { order_number: string; customer: string; amount: number; status: string }[];
  top_products: { id: number; name: string; sold_count: number }[];
};

export default function AdminClient({ view = "dashboard" }: { view?: string }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [msg, setMsg] = useState("");
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  const load = useCallback(async () => {
    if (!token) { location.href = "/login?next=/admin"; return; }
    setLoading(true);
    try {
      if (view === "products") {
        const response = await authFetch("/products/?page_size=100");
        if (response.status === 401) { location.href = "/login?next=/admin/products"; return; }
        if (response.status === 403) { location.href = "/account"; return; }
        if (!response.ok) { setProducts([]); setMsg("دریافت محصولات انجام نشد؛ دوباره تلاش کنید."); return; }
        const data = await response.json();
        setProducts(Array.isArray(data.results) ? data.results : Array.isArray(data) ? data : []);
      } else {
        const response = await authFetch("/admin/stats/");
        if (response.status === 401) { location.href = "/login?next=/admin"; return; }
        if (response.status === 403) { location.href = "/account"; return; }
        if (response.ok) setStats(await response.json());
      }
    } finally { setLoading(false); }
  }, [token, view]);

  // Loading here synchronizes the client-only auth token with the selected admin view.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);
  const filtered = useMemo(() => products.filter(product =>
    (statusFilter === "all" || (statusFilter === "active") === product.is_active) &&
    (!query.trim() || `${product.name} ${product.sku} ${product.brand.name}`.toLowerCase().includes(query.trim().toLowerCase()))
  ), [products, query, statusFilter]);

  async function remove(product: Product) {
    if (!window.confirm(`محصول «${product.name}» برای همیشه حذف شود؟ این عملیات قابل بازگشت نیست.`)) return;
    const response = await authFetch(`/products/${product.slug}/`, {
      method: "DELETE",
    });
    if (response.ok) {
      setMsg("محصول با موفقیت حذف شد ✓");
      await load();
      return;
    }
    const error = await response.json().catch(() => ({}));
    setMsg(error.detail || "حذف محصول ممکن نشد؛ ممکن است در سفارش‌ها استفاده شده باشد.");
  }

  if (view === "products") return <AdminShell title="مدیریت محصولات" action={<Link className="button primary" href="/admin/products/create">محصول جدید</Link>}>
    <div className="adminToolbar">
      <div className="adminSearch"><Search size={20} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="جستجو با نام، SKU یا برند..." /></div>
      <select aria-label="فیلتر وضعیت" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option value="all">همه وضعیت‌ها</option><option value="active">فعال</option><option value="inactive">غیرفعال</option></select>
      <button onClick={() => void load()}><RefreshCw size={18} /> به‌روزرسانی</button>
    </div>
    {msg && <div className="toastInline">{msg}</div>}
    {loading ? <div className="adminSkeleton" /> : <div className="adminProductTable">
      <header><span>محصول</span><span>دسته و برند</span><span>قیمت</span><span>موجودی</span><span>وضعیت</span><span>عملیات</span></header>
      {filtered.map(product => <article key={product.id}>
        <div className="adminProduct"><span><ProductVisual name={product.name} slug={product.slug} image={product.primary_image} decorative /></span><div><b>{product.name}</b><small>{product.sku}</small></div></div>
        <div><b>{product.category.name}</b><small>{product.brand.name}</small></div><strong>{formatPrice(product.base_price)}</strong>
        <span className={product.total_stock ? "stockGood" : "stockBad"}>{product.total_stock ? `${product.total_stock} عدد` : "ناموجود"}</span>
        <div className="productStatusActions"><span className={`statusPill ${product.is_active ? "on" : "off"}`}>{product.is_active ? "فعال" : "غیرفعال"}</span></div>
        <div className="rowActions"><Link href={`/admin/products/${product.id}`}>ویرایش</Link><a href={`/product/${product.slug}`} target="_blank" rel="noreferrer">نمایش</a><button className="deleteAction rowDelete" aria-label={`حذف ${product.name}`} title="حذف محصول" onClick={() => void remove(product)}><Trash2 aria-hidden="true" /><span>حذف</span></button></div>
      </article>)}
      {!filtered.length && <div className="adminEmpty">محصولی با این مشخصات پیدا نشد.</div>}
    </div>}
  </AdminShell>;

  const maxRevenue = Math.max(...(stats?.chart.map(item => item.revenue) || [1]), 1);
  return <AdminShell title="داشبورد مدیریت" action={<Link className="button primary" href="/admin/products/create">محصول جدید</Link>}>
    {loading || !stats ? <div className="adminSkeleton" /> : <>
      <section className="adminWelcome"><div><span>سلام، وقت بخیر</span><h2>فروشگاه امروز چه خبر؟</h2><p>آمار لحظه‌ای فروش، سفارش‌ها و موجودی را از همین‌جا کنترل کنید.</p></div><div><small>فروش امروز</small><b>{formatPrice(stats.revenue_today)}</b></div></section>
      <div className="adminStats">
        <Link aria-label="مشاهده تراکنش‌های فروش" className="adminStatLink" href="/admin/orders"><article><i><TrendingUp /></i><span>فروش کل</span><b>{formatPrice(stats.revenue)}</b><small>مشاهده تراکنش‌ها ←</small></article></Link>
        <Link aria-label="مشاهده سفارش‌ها" className="adminStatLink" href="/admin/orders"><article><i><ShoppingBag /></i><span>کل سفارش‌ها</span><b>{stats.orders.toLocaleString("fa-IR")}</b><small>{stats.pending_orders.toLocaleString("fa-IR")} سفارش در جریان ←</small></article></Link>
        <Link aria-label="مدیریت کاربران" className="adminStatLink" href="/admin/users"><article><i><Users /></i><span>مشتریان</span><b>{stats.users.toLocaleString("fa-IR")}</b><small>مدیریت کاربران ←</small></article></Link>
        <Link aria-label="مدیریت محصولات" className="adminStatLink" href="/admin/products"><article><i><Package /></i><span>محصولات</span><b>{stats.products.toLocaleString("fa-IR")}</b><small>{stats.out_of_stock.toLocaleString("fa-IR")} کالای ناموجود ←</small></article></Link>
      </div>
      <div className="adminDashboardGrid">
        <section className="adminChartPanel"><header><div><span>نمودار فروش</span><h3>عملکرد ۳۰ روز اخیر</h3></div><b>{formatPrice(stats.revenue)}</b></header><div className="modernChart">
          {stats.chart.length ? stats.chart.map((item, index) => <div key={index}><i style={{ height: `${Math.max(8, item.revenue / maxRevenue * 100)}%` }} title={`${item.day} — ${formatPrice(item.revenue)}`} /><small>{new Date(item.day).toLocaleDateString("fa-IR", { day: "numeric", month: "short" })}</small></div>) : <p>پس از ثبت اولین پرداخت، نمودار فروش اینجا نمایش داده می‌شود.</p>}
        </div></section>
        <section className="inventoryPanel"><header><div><span>هشدار موجودی</span><h3>نیازمند توجه</h3></div><Link href="/admin/inventory">مدیریت ←</Link></header><div><span>کالاهای کم‌موجود</span><b>{stats.low_stock.toLocaleString("fa-IR")}</b></div><div className="danger"><span>کالاهای ناموجود</span><b>{stats.out_of_stock.toLocaleString("fa-IR")}</b></div></section>
        <section className="recentOrders"><header><div><span>سفارش‌های تازه</span><h3>آخرین تراکنش‌ها</h3></div><Link href="/admin/orders">همه سفارش‌ها ←</Link></header>{stats.recent_orders.map(order => <Link href={`/admin/orders/${order.order_number}`} key={order.order_number}><b>{order.order_number}</b><span>{order.customer}</span><strong>{formatPrice(order.amount)}</strong><i>{order.status}</i></Link>)}{!stats.recent_orders.length && <p>هنوز سفارشی ثبت نشده است.</p>}</section>
        <section className="topProducts"><header><div><span>محصولات برتر</span><h3>بیشترین فروش</h3></div></header>{stats.top_products.map((product, index) => <div key={product.id}><i>{index + 1}</i><span>{product.name}</span><b>{product.sold_count.toLocaleString("fa-IR")} فروش</b></div>)}</section>
      </div>
    </>}
  </AdminShell>;
}
