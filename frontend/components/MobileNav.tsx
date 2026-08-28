"use client";

import { Grid2X2, Home, Search, ShoppingBag, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [{ href: "/", label: "خانه", icon: Home }, { href: "/shop", label: "دسته‌ها", icon: Grid2X2 }, { href: "/search", label: "جستجو", icon: Search }, { href: "/cart", label: "سبد", icon: ShoppingBag }, { href: "/account", label: "حساب", icon: UserRound }];
export default function MobileNav() {
  const pathname = usePathname();
  return <nav className="mobileNav" aria-label="منوی موبایل">{items.map(({ href, label, icon: Icon }) => <Link className={pathname === href || href !== "/" && pathname.startsWith(href) ? "active" : ""} href={href} key={href}><Icon /><span>{label}</span></Link>)}</nav>;
}
