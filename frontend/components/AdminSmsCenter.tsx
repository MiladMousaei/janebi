"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { LoaderCircle, MessageSquareText, Phone, Search, Send, Trash2, Users } from "lucide-react";
import { API_URL } from "../lib/api";
import { authFetch } from "../lib/authFetch";
import { notify } from "../lib/notify";
import AdminShell from "./AdminShell";

type User = { id: number; first_name: string; last_name: string; email: string; phone: string; is_active: boolean };
type Sms = { id: number; recipient_name: string; phone: string; message: string; status: string; error_message: string; created_at: string };
const statusLabels: Record<string, string> = { queued: "در صف ارسال", sent: "ارسال‌شده", failed: "ناموفق" };

export default function AdminSmsCenter() {
  const [users, setUsers] = useState<User[]>([]);
  const [history, setHistory] = useState<Sms[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [audience, setAudience] = useState<"selected" | "all">("selected");
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  const load = useCallback(async () => {
    if (!token) { location.href = "/login?next=/admin/sms"; return; }
    const [usersResponse, historyResponse] = await Promise.all([
      authFetch("/admin/users/?page_size=100"),
      authFetch("/admin/sms/"),
    ]);
    if (usersResponse.status === 401 || historyResponse.status === 401) { location.href = "/login?next=/admin/sms"; return; }
    if (usersResponse.status === 403 || historyResponse.status === 403) { location.href = "/account"; return; }
    if (usersResponse.ok) { const data = await usersResponse.json(); setUsers((data.results || data).filter((user: User) => user.phone)); }
    if (historyResponse.ok) setHistory(await historyResponse.json());
    setLoading(false);
  }, [token]);
  // Loading here synchronizes the client-only auth token with the admin workspace.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);
  const filtered = users.filter(user => `${user.first_name} ${user.last_name} ${user.email} ${user.phone}`.toLowerCase().includes(query.toLowerCase()));

  function toggleUser(id: number) { setSelected(previous => previous.includes(id) ? previous.filter(item => item !== id) : [...previous, id]); }
  async function submit(event: FormEvent) {
    event.preventDefault(); setSending(true);
    const response = await authFetch("/admin/sms/", { method: "POST", body: JSON.stringify({ audience, user_ids: selected, message }) });
    const body = await response.json().catch(() => ({}));
    if (response.ok) { notify(`${body.length.toLocaleString("fa-IR")} پیام در فرایند ارسال قرار گرفت.`); setMessage(""); setSelected([]); await load(); }
    else notify(Object.values(body).flat().join("، ") || "ارسال پیامک انجام نشد.", "error");
    setSending(false);
  }
  async function remove(id: number) {
    if (!window.confirm("این پیام از تاریخچه حذف شود؟")) return;
    setDeleting(id);
    const response = await authFetch(`/admin/sms/?id=${id}`, { method: "DELETE" });
    if (response.ok) { setHistory(items => items.filter(item => item.id !== id)); notify("پیام از تاریخچه حذف شد.", "info"); }
    else notify("حذف پیام انجام نشد.", "error");
    setDeleting(null);
  }

  return <AdminShell title="ارسال پیامک" eyebrow="ارتباط مستقیم با مشتریان">
    <div className="smsWorkspace">
      <form className="smsComposer" onSubmit={submit}><header><span><MessageSquareText /></span><div><small>پیام تازه</small><h2>ارسال پیامک به کاربران</h2><p>مخاطبان را انتخاب کنید و متن پیام را بنویسید.</p></div></header>
        <div className="smsAudience"><button type="button" className={audience === "selected" ? "active" : ""} onClick={() => setAudience("selected")}><Users /> کاربران انتخابی</button><button type="button" className={audience === "all" ? "active" : ""} onClick={() => setAudience("all")}><Phone /> همه کاربران</button></div>
        {audience === "selected" && <div className="smsUserPicker"><div className="smsUserSearch"><Search /><input aria-label="جستجوی کاربران" value={query} onChange={event => setQuery(event.target.value)} placeholder="جستجوی نام، موبایل یا ایمیل" /></div><div>{loading ? <LoaderCircle className="spin" /> : filtered.map(user => <label htmlFor={`sms-user-${user.id}`} className={selected.includes(user.id) ? "selected" : ""} key={user.id}><span className="srOnly">انتخاب کاربر</span><input id={`sms-user-${user.id}`} type="checkbox" checked={selected.includes(user.id)} onChange={() => toggleUser(user.id)} /><span><b>{user.first_name || "کاربر"} {user.last_name}</b><small>{user.phone}</small></span></label>)}</div><small>{selected.length.toLocaleString("fa-IR")} کاربر انتخاب شده</small></div>}
        <label className="smsText">متن پیام<textarea value={message} onChange={event => setMessage(event.target.value)} required maxLength={500} placeholder="متن پیامک را اینجا بنویسید…" /><small>{message.length.toLocaleString("fa-IR")} از ۵۰۰ کاراکتر</small></label>
        <button className="button primary" disabled={sending || !message.trim() || audience === "selected" && !selected.length}>{sending ? <LoaderCircle className="spin" /> : <Send />} ارسال پیامک</button>
      </form>
      <section className="smsHistory"><header><div><small>گزارش ارسال</small><h2>پیام‌های اخیر</h2></div><b>{history.length.toLocaleString("fa-IR")}</b></header><div>{history.map(item => <article key={item.id}><span><Phone /></span><div><b>{item.recipient_name}</b><small dir="ltr">{item.phone}</small><p>{item.message}</p>{item.error_message && <em>{item.error_message}</em>}</div><i className={`smsStatus ${item.status}`}>{statusLabels[item.status] || item.status}</i><time>{new Date(item.created_at).toLocaleString("fa-IR")}</time><button className="smsDelete" type="button" onClick={() => remove(item.id)} disabled={deleting === item.id} aria-label={`حذف پیام ${item.recipient_name}`}>{deleting === item.id ? <LoaderCircle className="spin" /> : <Trash2 />}</button></article>)}{!history.length && !loading && <p className="smsEmpty">هنوز پیامکی ثبت نشده است.</p>}</div></section>
    </div>
  </AdminShell>;
}
