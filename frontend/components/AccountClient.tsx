"use client";

import { CheckCircle2, Clock3, PackageSearch } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { API_URL, formatPrice } from "../lib/api";
import AccountShell from "./AccountShell";

type Order = { id: number; order_number: string; final_amount: number; status: string; payment_status: string; created_at: string };
const statusFa: Record<string, string> = { pending: "در انتظار پرداخت", paid: "پرداخت‌شده", processing: "در حال آماده‌سازی", shipped: "ارسال‌شده", delivered: "تحویل‌شده", cancelled: "لغوشده", returned: "مرجوعی" };

export default function AccountClient({ view = "dashboard" }: { view?: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    fetch(`${API_URL}/orders/`, { headers: { Authorization: `Bearer ${token}` } })
      .then(response => response.ok ? response.json() : { results: [] })
      .then(body => setOrders(body.results || body)).finally(() => setLoading(false));
  }, []);
  const processing = orders.filter(order => ["paid", "processing", "shipped"].includes(order.status)).length;
  return <AccountShell>
    {view === "dashboard" && <><div className="accountWelcome"><span>حساب کاربری من</span><h1>خوش آمدید</h1><p>سفارش‌ها، آدرس‌ها و انتخاب‌های محبوبتان همیشه در دسترس است.</p></div><div className="statCards">
      <Link href="/account/orders"><i><PackageSearch /></i><span>همه سفارش‌ها</span><b>{orders.length.toLocaleString("fa-IR")}</b><small>مشاهده سفارش‌ها ←</small></Link>
      <Link href="/account/orders"><i><CheckCircle2 /></i><span>تحویل‌شده</span><b>{orders.filter(order => order.status === "delivered").length.toLocaleString("fa-IR")}</b><small>سوابق خرید ←</small></Link>
      <Link href="/account/orders"><i><Clock3 /></i><span>در حال پردازش</span><b>{processing.toLocaleString("fa-IR")}</b><small>پیگیری وضعیت ←</small></Link>
    </div><div className="accountSectionHead"><div><span>خریدهای اخیر</span><h2>آخرین سفارش‌ها</h2></div><Link href="/account/orders">مشاهده همه</Link></div></>}
    {view === "orders" && <div className="accountSectionHead"><div><span>تاریخچه خرید</span><h1>سفارش‌های من</h1></div><Link href="/shop">خرید جدید</Link></div>}
    {loading ? <div className="accountListSkeleton" /> : orders.length ? <div className="orderList">{orders.map(order => <Link href={`/account/orders/${order.order_number}`} key={order.id}><div><b>{order.order_number}</b><small>{new Date(order.created_at).toLocaleDateString("fa-IR")}</small></div><span className="badge">{statusFa[order.status] || order.status}</span><strong>{formatPrice(order.final_amount)}</strong></Link>)}</div> : <div className="emptyState"><b>هنوز سفارشی ندارید</b><a className="button primary" href="/shop">رفتن به فروشگاه</a></div>}
  </AccountShell>;
}
