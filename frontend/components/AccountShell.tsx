"use client";

import { Heart, LayoutDashboard, LogOut, MapPinned, PackageSearch, Store, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { API_URL } from "../lib/api";

type User = { first_name: string; last_name: string; email: string; phone: string; is_staff: boolean };
const links = [
  { href: "/account", label: "داشبورد", icon: LayoutDashboard },
  { href: "/account/orders", label: "سفارش‌ها", icon: PackageSearch },
  { href: "/account/addresses", label: "آدرس‌ها", icon: MapPinned },
  { href: "/account/wishlist", label: "علاقه‌مندی‌ها", icon: Heart },
];

export default function AccountShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) { location.href = `/login?next=${encodeURIComponent(pathname)}`; return; }
    fetch(`${API_URL}/auth/profile/`, { headers: { Authorization: `Bearer ${token}` } })
      .then(response => response.ok ? response.json() : Promise.reject())
      .then(setUser).catch(() => { localStorage.removeItem("access_token"); location.href = "/login"; });
  }, [pathname]);

  async function logout() {
    const token = localStorage.getItem("access_token");
    const refresh = localStorage.getItem("refresh_token");
    if (token && refresh) fetch(`${API_URL}/auth/logout/`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ refresh }) }).catch(() => undefined);
    localStorage.clear(); location.href = "/login";
  }

  if (!user) return <div className="skeletonBox" />;
  return <div className="accountLayout">
    <aside className="accountNav">
      <div className="accountProfile"><div className="userAvatar"><UserRound /></div><div><b>{user.first_name || "کاربر"} {user.last_name}</b><small>{user.phone || user.email}</small></div></div>
      <nav aria-label="منوی حساب کاربری">{links.map(({ href, label, icon: Icon }) => <Link className={pathname === href || href !== "/account" && pathname.startsWith(`${href}/`) ? "active" : ""} href={href} key={href}><Icon /><span>{label}</span></Link>)}</nav>
      {user.is_staff && <Link className="accountAdminLink" href="/admin"><Store /><span>مدیریت فروشگاه</span></Link>}
      <button className="accountLogout" onClick={logout}><LogOut /><span>خروج از حساب</span></button>
    </aside>
    <section className="accountContent">{children}</section>
  </div>;
}
