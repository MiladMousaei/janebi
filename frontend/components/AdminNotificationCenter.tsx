"use client";

import Link from "next/link";
import { Bell, Headphones, ShoppingBag } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { authFetch } from "../lib/authFetch";

type AdminNotification = {
  id: number;
  kind: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
};

function destination(kind: string) {
  return kind === "order_created" ? "/admin/orders" : "/admin/tickets";
}

export default function AdminNotificationCenter() {
  const [items, setItems] = useState<AdminNotification[]>([]);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    if (!localStorage.getItem("access_token")) return;
    const response = await authFetch("/notifications/?page_size=20");
    if (!response.ok) return;
    const data = await response.json();
    setItems((data.results || data).slice(0, 12));
  }, []);

  useEffect(() => {
    // The initial request synchronizes the authenticated notification feed with this client-only widget.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    const timer = window.setInterval(() => void load(), 45000);
    return () => window.clearInterval(timer);
  }, [load]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const unread = items.filter(item => !item.is_read).length;

  async function togglePanel() {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (!nextOpen || unread === 0) return;
    const previous = items;
    setItems(current => current.map(item => ({ ...item, is_read: true })));
    const response = await authFetch("/notifications/mark_all_read/", { method: "POST" });
    if (!response.ok) setItems(previous);
  }

  return <div className="adminNotificationCenter" ref={root}>
    <button className="adminNotificationTrigger" onClick={() => void togglePanel()} aria-label={unread ? `${unread.toLocaleString("fa-IR")} اعلان خوانده‌نشده` : "اعلان‌های مدیریت"} aria-expanded={open}>
      <Bell aria-hidden="true" />
      {unread > 0 && <b>{Math.min(unread, 99).toLocaleString("fa-IR")}</b>}
    </button>
    {open && <section className="adminNotificationPanel" aria-label="اعلان‌های مدیریت">
      <header><div><small>مرکز اعلان‌ها</small><h2>سفارش‌ها و تیکت‌های تازه</h2></div><span>{unread ? `${unread.toLocaleString("fa-IR")} جدید` : "خوانده شد"}</span></header>
      <div className="adminNotificationList">
        {items.length ? items.map(item => <Link href={destination(item.kind)} onClick={() => setOpen(false)} className={item.is_read ? "" : "unread"} key={item.id}>
          <i>{item.kind === "order_created" ? <ShoppingBag aria-hidden="true" /> : <Headphones aria-hidden="true" />}</i>
          <span><b>{item.title}</b><p>{item.message}</p><small>{new Date(item.created_at).toLocaleString("fa-IR", { dateStyle: "short", timeStyle: "short" })}</small></span>
        </Link>) : <div className="adminNotificationEmpty"><Bell aria-hidden="true" /><b>اعلان تازه‌ای نیست</b><p>سفارش‌ها و تیکت‌های جدید اینجا نمایش داده می‌شوند.</p></div>}
      </div>
    </section>}
  </div>;
}
