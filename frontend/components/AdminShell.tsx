"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

const groups = [
  { label: "فروشگاه", links: [["/admin", "⌂", "نمای کلی"], ["/admin/products", "▦", "محصولات"], ["/admin/categories", "◫", "دسته‌بندی‌ها"], ["/admin/brands", "◇", "برندها"], ["/admin/inventory", "▤", "موجودی"]] },
  { label: "فروش", links: [["/admin/orders", "▣", "سفارش‌ها"], ["/admin/coupons", "٪", "کوپن‌ها"], ["/admin/reviews", "★", "نظرات"]] },
  { label: "کاربران", links: [["/admin/users", "♙", "مشتریان"]] },
];

export default function AdminShell({ children, title, eyebrow="مرکز کنترل فروشگاه", action }: { children: ReactNode; title: string; eyebrow?: string; action?: ReactNode }) {
  const pathname=usePathname();
  const[menuOpen,setMenuOpen]=useState(false);
  return <div className={`adminLayout ${menuOpen?"menuOpen":""}`}>{menuOpen&&<button className="adminBackdrop" aria-label="بستن منو" onClick={()=>setMenuOpen(false)}/>}<aside className="adminNav"><Link className="adminBrand" href="/admin"><span>ج</span><div><b>جانِبی</b><small>مدیریت فروشگاه</small></div></Link><div className="adminNavGroups">{groups.map(group=><section key={group.label}><small>{group.label}</small>{group.links.map(([href,icon,label])=><Link onClick={()=>setMenuOpen(false)} href={href} className={pathname===href||href!=="/admin"&&pathname.startsWith(`${href}/`)?"active":""} key={href}><i>{icon}</i><span>{label}</span></Link>)}</section>)}</div><Link className="adminStoreLink" href="/">↗ مشاهده فروشگاه</Link></aside><main className="adminMain"><header className="adminTopbar"><button className="adminMenu" onClick={()=>setMenuOpen(true)} aria-label="نمایش منو">☰</button><div className="adminHead"><div><span>{eyebrow}</span><h1>{title}</h1></div>{action}</div><div className="adminIdentity"><span>م</span><div><b>مدیر فروشگاه</b><small>دسترسی کامل</small></div></div></header>{children}</main></div>;
}
