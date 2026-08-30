"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Trash2 } from "lucide-react";
import { formatPrice } from "../lib/api";
import { authFetch } from "../lib/authFetch";
import AdminShell from "./AdminShell";

type View = "categories" | "brands" | "orders" | "users" | "coupons" | "reviews" | "inventory";
type Row = {
  id: number; name?: string; slug?: string; order_number?: string; final_amount?: number;
  status?: string; payment_status?: string; email?: string; phone?: string; first_name?: string;
  last_name?: string; order_count?: number; is_active?: boolean; code?: string; discount_value?: number;
  discount_type?: string; title?: string; comment?: string; rating?: number; is_approved?: boolean;
  product_name?: string; product_total_stock?: number; sku?: string; stock?: number; low_stock_threshold?: number;
};
const config: Record<View, { title: string; eyebrow: string; endpoint: string; search: string }> = {
  categories: { title: "دسته‌بندی‌ها", eyebrow: "ساختار کاتالوگ", endpoint: "categories", search: "جستجو در دسته‌ها..." },
  brands: { title: "برندها", eyebrow: "تأمین‌کنندگان و سازندگان", endpoint: "brands", search: "جستجو در برندها..." },
  orders: { title: "سفارش‌ها", eyebrow: "مدیریت فرایند فروش", endpoint: "orders", search: "شماره سفارش..." },
  users: { title: "مشتریان", eyebrow: "مدیریت کاربران", endpoint: "admin/users", search: "نام، ایمیل یا موبایل..." },
  coupons: { title: "کوپن‌های تخفیف", eyebrow: "کمپین‌ها و تخفیف‌ها", endpoint: "coupons", search: "کد تخفیف..." },
  reviews: { title: "نظرات مشتریان", eyebrow: "کنترل محتوای کاربران", endpoint: "reviews", search: "متن یا عنوان نظر..." },
  inventory: { title: "مدیریت موجودی", eyebrow: "انبار و تنوع محصولات", endpoint: "admin/inventory", search: "نام محصول یا SKU..." },
};
const statuses: Record<string, string> = { pending: "در انتظار", paid: "پرداخت‌شده", processing: "در حال پردازش", shipped: "ارسال‌شده", delivered: "تحویل‌شده", cancelled: "لغوشده", returned: "مرجوع‌شده" };

export default function AdminResource({ view }: { view: View }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [msg, setMsg] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const info = config[view];

  const load = useCallback(async () => {
    if (!token) { location.href = `/login?next=/admin/${view}`; return; }
    setLoading(true);
    const response = await authFetch(`/${info.endpoint}/?page_size=100`);
    if (response.status === 401) { location.href = `/login?next=/admin/${view}`; return; }
    if (response.status === 403) { location.href = "/account"; return; }
    const data = await response.json();
    setRows(data.results || data);
    setLoading(false);
  }, [info.endpoint, token, view]);
  // The protected resource is loaded after the browser-only session token becomes available.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);
  const filtered = useMemo(() => rows.filter(row => JSON.stringify(row).toLowerCase().includes(query.trim().toLowerCase())), [rows, query]);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    const payload = view === "coupons" ? { ...data, discount_value: Number(data.discount_value), minimum_order_amount: Number(data.minimum_order_amount || 0), maximum_discount: Number(data.maximum_discount || 0) || null, usage_limit: Number(data.usage_limit || 0) || null, user_usage_limit: 1, is_active: true, start_date: new Date().toISOString(), expiration_date: new Date(Date.now() + 31536000000).toISOString() } : { ...data, is_active: true };
    const response = await authFetch(`/${info.endpoint}/`, { method: "POST", body: JSON.stringify(payload) });
    setMsg(response.ok ? "با موفقیت ذخیره شد ✓" : "ذخیره ممکن نشد");
    if (response.ok) { form.reset(); await load(); }
  }

  async function patch(row: Row, data: Record<string, unknown>, customPath?: string) {
    const path = customPath || `/${info.endpoint}/${row.slug || row.id}/`;
    const response = await authFetch(path, { method: "PATCH", body: JSON.stringify(data) });
    setMsg(response.ok ? "تغییرات ذخیره شد ✓" : "به‌روزرسانی ممکن نشد");
    if (response.ok || view === "inventory") await load();
  }
  async function remove(row: Row) {
    const label = row.name || row.code || row.title || `${row.first_name || ""} ${row.last_name || ""}`.trim() || `مورد ${row.id}`;
    if (!window.confirm(`«${label}» برای همیشه حذف شود؟ این عملیات قابل بازگشت نیست.`)) return;
    const path = view === "users" ? `/admin/users/${row.id}/delete/` : `/${info.endpoint}/${row.slug || row.id}/`;
    const response = await authFetch(path, { method: "DELETE" });
    if (response.ok) {
      setMsg("مورد با موفقیت حذف شد ✓");
      await load();
      return;
    }
    const error = await response.json().catch(() => ({}));
    setMsg(error.detail || "حذف این مورد ممکن نشد؛ ممکن است در بخش دیگری استفاده شده باشد.");
  }
  function setInventoryDraft(id: number, stock: number) { setRows(previous => previous.map(row => row.id === id ? { ...row, stock } : row)); }

  const action = view === "categories" || view === "brands" ? <button className="button primary" onClick={() => document.getElementById("quick-create")?.scrollIntoView({ behavior: "smooth" })}>＋ افزودن مورد</button> : undefined;
  return <AdminShell title={info.title} eyebrow={info.eyebrow} action={action}>
    <div className="adminToolbar"><div className="adminSearch"><span>⌕</span><input value={query} onChange={event => setQuery(event.target.value)} placeholder={info.search} /></div><button onClick={() => void load()}>↻ به‌روزرسانی</button></div>
    {msg && <div className="toastInline">{msg}</div>}
    {(["categories", "brands", "coupons"] as View[]).includes(view) && <form id="quick-create" className="quickCreate modern" onSubmit={create}><div><b>{view === "coupons" ? "ساخت کوپن جدید" : "افزودن مورد جدید"}</b><small>اطلاعات را وارد و ذخیره کنید</small></div>{view === "coupons" ? <><input name="code" placeholder="کد کوپن" required dir="ltr" /><select name="discount_type"><option value="percentage">درصدی</option><option value="fixed">مبلغ ثابت</option></select><input name="discount_value" type="number" placeholder="مقدار تخفیف" required /><input name="minimum_order_amount" type="number" placeholder="حداقل سفارش" /><input name="maximum_discount" type="number" placeholder="سقف تخفیف" /><input name="usage_limit" type="number" placeholder="تعداد استفاده" /></> : <><input name="name" placeholder="نام فارسی" required /><input name="slug" placeholder="slug" required dir="ltr" /></>}<button className="button primary">ذخیره</button></form>}
    {loading ? <div className="adminSkeleton" /> : <div className={`resourceTable modern ${view}`}>
      {filtered.map(row => <article key={row.id}>
        {view === "categories" || view === "brands" ? <><div className="resourceName"><i>{row.name?.slice(0, 1)}</i><div><b>{row.name}</b><small>شناسه {row.id}</small></div></div><code>{row.slug}</code><span className={`statusPill ${row.is_active ? "on" : "off"}`}>{row.is_active ? "فعال" : "غیرفعال"}</span><div className="resourceActions"><button onClick={() => patch(row, { is_active: !row.is_active })}>{row.is_active ? "غیرفعال‌سازی" : "فعال‌سازی"}</button><button className="deleteAction" aria-label={`حذف ${row.name}`} onClick={() => void remove(row)}><Trash2 aria-hidden="true" /><span>حذف</span></button></div></> : null}
        {view === "orders" ? <><div><b>{row.order_number}</b><small>سفارش فروشگاه</small></div><strong>{formatPrice(row.final_amount || 0)}</strong><span>{row.payment_status === "paid" ? "پرداخت موفق" : "در انتظار پرداخت"}</span><select value={row.status} onChange={event => patch(row, { status: event.target.value }, `/orders/${row.order_number}/set_status/`)}>{Object.entries(statuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></> : null}
        {view === "users" ? <><div className="resourceName"><i>{row.first_name?.slice(0, 1) || "ک"}</i><div><b>{row.first_name} {row.last_name}</b><small>{row.email}</small></div></div><span>{row.phone || "—"}</span><b>{(row.order_count || 0).toLocaleString("fa-IR")} سفارش</b><div className="resourceActions"><button className={`statusPill ${row.is_active ? "on" : "off"}`} onClick={() => patch(row, { is_active: !row.is_active }, `/admin/users/${row.id}/set_active/`)}>{row.is_active ? "فعال" : "مسدود"}</button><button className="deleteAction" aria-label={`حذف ${row.first_name || "کاربر"}`} onClick={() => void remove(row)}><Trash2 aria-hidden="true" /><span>حذف</span></button></div></> : null}
        {view === "coupons" ? <><div><b dir="ltr">{row.code}</b><small>{row.discount_type === "percentage" ? "درصدی" : "مبلغ ثابت"}</small></div><strong>{row.discount_type === "percentage" ? `${row.discount_value}٪` : formatPrice(row.discount_value || 0)}</strong><span className={`statusPill ${row.is_active ? "on" : "off"}`}>{row.is_active ? "فعال" : "غیرفعال"}</span><div className="resourceActions"><button onClick={() => patch(row, { is_active: !row.is_active })}>{row.is_active ? "توقف" : "فعال‌سازی"}</button><button className="deleteAction" aria-label={`حذف کوپن ${row.code}`} onClick={() => void remove(row)}><Trash2 aria-hidden="true" /><span>حذف</span></button></div></> : null}
        {view === "reviews" ? <><div><b>{row.title}</b><small>{"★".repeat(row.rating || 0)}</small></div><p>{row.comment}</p><span className={`statusPill ${row.is_approved ? "on" : "off"}`}>{row.is_approved ? "تأییدشده" : "در انتظار"}</span><div className="resourceActions"><button onClick={() => patch(row, { is_approved: !row.is_approved }, `/reviews/${row.id}/moderate/`)}>{row.is_approved ? "لغو تأیید" : "تأیید نظر"}</button><button className="deleteAction" aria-label={`حذف نظر ${row.title}`} onClick={() => void remove(row)}><Trash2 aria-hidden="true" /><span>حذف</span></button></div></> : null}
        {view === "inventory" ? <><div><b>{row.product_name}</b><small>{row.sku}</small></div><label>موجودی این تنوع<input type="number" min="0" value={row.stock ?? 0} disabled={!row.is_active} onChange={event => setInventoryDraft(row.id, Math.max(0, Number(event.target.value)))} onKeyDown={event => { if (event.key === "Enter") event.currentTarget.blur(); }} onBlur={event => patch(row, { stock: Number(event.target.value) })} /></label><div className="inventoryTotals"><span className={!row.is_active ? "stockBad" : (row.stock || 0) <= (row.low_stock_threshold || 0) ? "stockBad" : "stockGood"}>{!row.is_active ? "خارج از موجودی" : (row.stock || 0) <= (row.low_stock_threshold || 0) ? "نیاز به تأمین" : "موجودی مناسب"}</span><small>موجودی کل محصول: <b>{(row.product_total_stock || 0).toLocaleString("fa-IR")}</b></small></div><button className="inventoryToggle" onClick={() => patch(row, row.is_active ? { stock: 0, is_active: false } : { is_active: true })}>{row.is_active ? "حذف از موجودی" : "فعال‌سازی دوباره"}</button></> : null}
      </article>)}
      {!filtered.length && <div className="adminEmpty">موردی برای نمایش پیدا نشد.</div>}
    </div>}
  </AdminShell>;
}
