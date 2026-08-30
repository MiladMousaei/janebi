"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes, ChevronLeft, CircleUserRound, FolderTree, Gem, Headphones, LayoutDashboard,
  LogOut, Menu, MessageSquareText, Package, Percent, Settings, ShoppingBag, Star, Store,
  Users, X, type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { API_URL } from "../lib/api";
import AdminNotificationCenter from "./AdminNotificationCenter";

type NavLink = { href: string; label: string; icon: LucideIcon };
const groups: { label: string; links: NavLink[] }[] = [
  { label: "فروشگاه", links: [
    { href: "/admin", label: "نمای کلی", icon: LayoutDashboard },
    { href: "/admin/products", label: "محصولات", icon: Package },
    { href: "/admin/categories", label: "دسته‌بندی‌ها", icon: FolderTree },
    { href: "/admin/brands", label: "برندها", icon: Gem },
    { href: "/admin/inventory", label: "موجودی", icon: Boxes },
  ]},
  { label: "فروش", links: [
    { href: "/admin/orders", label: "سفارش‌ها", icon: ShoppingBag },
    { href: "/admin/coupons", label: "کوپن‌ها", icon: Percent },
    { href: "/admin/reviews", label: "نظرات", icon: Star },
  ]},
  { label: "مدیریت", links: [
    { href: "/admin/users", label: "مشتریان", icon: Users },
    { href: "/admin/tickets", label: "تیکت‌ها", icon: Headphones },
    { href: "/admin/sms", label: "ارسال پیامک", icon: MessageSquareText },
    { href: "/admin/store-settings", label: "مدیریت فروشگاه", icon: Store },
    { href: "/admin/settings", label: "اطلاعات مدیر", icon: Settings },
  ]},
];

export default function AdminShell({ children, title, eyebrow = "مرکز کنترل فروشگاه", action }: { children: ReactNode; title: string; eyebrow?: string; action?: ReactNode }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    const token = localStorage.getItem("access_token");
    const refresh = localStorage.getItem("refresh_token");
    if (token && refresh) {
      try {
        await fetch(`${API_URL}/auth/logout/`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ refresh }),
        });
      } catch { /* session is cleared locally even if the API is unavailable */ }
    }
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    location.href = "/login";
  }

  return <div className={`adminLayout ${menuOpen ? "menuOpen" : ""}`}>
    {menuOpen && <button className="adminBackdrop" aria-label="بستن منو" onClick={() => setMenuOpen(false)} />}
    <aside className="adminNav">
      <div className="adminNavIntro">
        <Link className="adminBrand" href="/admin"><span>ج</span><div><b>جانِبی</b><small>مدیریت فروشگاه</small></div></Link>
        <button className="adminNavClose" aria-label="بستن منو" onClick={() => setMenuOpen(false)}><X size={21} /></button>
      </div>
      <div className="adminNavGroups">{groups.map(group => <section key={group.label}>
        <small>{group.label}</small>
        {group.links.map(({ href, label, icon: Icon }) => <Link onClick={() => setMenuOpen(false)} href={href} className={pathname === href || href !== "/admin" && pathname.startsWith(`${href}/`) ? "active" : ""} key={href}>
          <Icon aria-hidden="true" /><span>{label}</span>
        </Link>)}
      </section>)}</div>
      <div className="adminNavFooter">
        <Link className="adminStoreLink" href="/"><Store size={18} /><span>مشاهده فروشگاه</span><ChevronLeft size={16} /></Link>
        <button className="adminLogout" onClick={logout} disabled={loggingOut}><LogOut size={18} /><span>{loggingOut ? "در حال خروج…" : "خروج امن"}</span></button>
      </div>
    </aside>
    <main className="adminMain">
      <header className="adminTopbar">
        <button className="adminMenu" onClick={() => setMenuOpen(true)} aria-label="نمایش منو"><Menu size={22} /></button>
        <div className="adminHead"><div><span>{eyebrow}</span><h1>{title}</h1></div><div className="adminHeadActions"><AdminNotificationCenter />{action}</div></div>
        <Link className="adminIdentity" href="/admin/settings" aria-label="ویرایش اطلاعات مدیر">
          <span><CircleUserRound size={22} /></span><div><b>مدیر فروشگاه</b><small>ویرایش حساب</small></div>
        </Link>
      </header>
      {children}
    </main>
  </div>;
}
