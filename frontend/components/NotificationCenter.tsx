"use client";

import { Bell, CheckCircle2, PackageCheck } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { API_URL } from "../lib/api";

type Notification = { id: number; kind: string; title: string; message: string; is_read: boolean; created_at: string };

export default function NotificationCenter() {
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    fetch(`${API_URL}/notifications/`, { headers: { Authorization: `Bearer ${token}` } })
      .then(response => response.ok ? response.json() : null)
      .then(data => data && setItems((data.results || data).slice(0, 6)));
  }, []);
  useEffect(() => {
    const close = (event: MouseEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  const unread = items.filter(item => !item.is_read).length;
  return <div className="notificationCenter" ref={root}>
    <button className="notificationTrigger" onClick={() => setOpen(value => !value)} aria-label="اعلان‌ها" aria-expanded={open}><Bell aria-hidden="true" />{unread > 0 && <b>{unread.toLocaleString("fa-IR")}</b>}</button>
    {open && <div className="notificationPanel">
      <header><div><small>مرکز پیام‌ها</small><h3>اعلان‌های شما</h3></div>{unread > 0 && <span>{unread.toLocaleString("fa-IR")} جدید</span>}</header>
      <div className="notificationList">{items.length ? items.map(item => <article className={item.is_read ? "" : "unread"} key={item.id}><span>{item.kind === "payment_success" ? <CheckCircle2 /> : <PackageCheck />}</span><div><b>{item.title}</b><p>{item.message}</p><small>{new Date(item.created_at).toLocaleDateString("fa-IR")}</small></div></article>) : <div className="notificationEmpty"><Bell /><b>همه‌چیز آرام است</b><p>اعلان تازه‌ای ندارید.</p></div>}</div>
    </div>}
  </div>;
}
