"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Headphones, LoaderCircle, MessageCircleMore, Plus, Send, TicketCheck } from "lucide-react";
import { API_URL } from "../lib/api";
import { notify } from "../lib/notify";
import AccountShell from "./AccountShell";
import AdminShell from "./AdminShell";

type TicketMessage = { id: number; sender_name: string; body: string; is_admin_reply: boolean; created_at: string };
type Ticket = { id: number; subject: string; category: string; status: string; user_name: string; user_email: string; last_message_at: string; messages: TicketMessage[] };
const statusLabels: Record<string, string> = { open: "باز", pending: "در انتظار پاسخ", answered: "پاسخ داده‌شده", closed: "بسته" };
const categoryLabels: Record<string, string> = { general: "عمومی", order: "سفارش", payment: "پرداخت", product: "محصول" };

function TicketsWorkspace({ admin }: { admin: boolean }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const headers = useMemo(() => ({ "Content-Type": "application/json", Authorization: `Bearer ${token}` }), [token]);
  const selected = tickets.find(ticket => ticket.id === selectedId) || null;

  const load = useCallback(async () => {
    if (!token) { location.href = `/login?next=${admin ? "/admin/tickets" : "/account/tickets"}`; return; }
    const response = await fetch(`${API_URL}/tickets/?page_size=100`, { headers });
    if (response.status === 403) { location.href = "/account"; return; }
    if (!response.ok) { notify("دریافت تیکت‌ها انجام نشد.", "error"); setLoading(false); return; }
    const body = await response.json();
    const next: Ticket[] = body.results || body;
    setTickets(next);
    setSelectedId(previous => previous && next.some(ticket => ticket.id === previous) ? previous : next[0]?.id || null);
    setLoading(false);
  }, [admin, headers, token]);

  // Loading here synchronizes the client-only auth token with the selected support workspace.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void load(); }, [load]);

  async function createTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSending(true);
    const form = event.currentTarget;
    const response = await fetch(`${API_URL}/tickets/`, { method: "POST", headers, body: JSON.stringify(Object.fromEntries(new FormData(form))) });
    if (response.ok) { form.reset(); notify("تیکت شما ثبت شد."); await load(); }
    else notify("ثبت تیکت انجام نشد؛ اطلاعات را بررسی کنید.", "error");
    setSending(false);
  }

  async function reply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    setSending(true);
    const form = event.currentTarget;
    const message = String(new FormData(form).get("message") || "").trim();
    const response = await fetch(`${API_URL}/tickets/${selected.id}/reply/`, { method: "POST", headers, body: JSON.stringify({ message }) });
    if (response.ok) { form.reset(); notify("پیام ارسال شد."); await load(); }
    else notify("ارسال پیام انجام نشد.", "error");
    setSending(false);
  }

  async function changeStatus(status: string) {
    if (!selected || !admin) return;
    const response = await fetch(`${API_URL}/tickets/${selected.id}/`, { method: "PATCH", headers, body: JSON.stringify({ status }) });
    if (response.ok) { notify("وضعیت تیکت به‌روزرسانی شد."); await load(); }
    else notify("تغییر وضعیت انجام نشد.", "error");
  }

  if (loading) return <div className="supportLoading"><LoaderCircle className="spin" /> در حال دریافت گفتگوها…</div>;
  return <div className={`supportWorkspace ${admin ? "adminSupport" : ""}`}>
    <aside className="ticketSidebar">
      <header><span><TicketCheck /></span><div><small>{admin ? "مرکز پاسخگویی" : "پشتیبانی جانِبی"}</small><h2>{admin ? "تیکت‌های مشتریان" : "تیکت‌های من"}</h2></div></header>
      <div className="ticketList">{tickets.map(ticket => <button className={selectedId === ticket.id ? "active" : ""} onClick={() => setSelectedId(ticket.id)} key={ticket.id}><span><b>{ticket.subject}</b><small>{admin ? ticket.user_name : categoryLabels[ticket.category]}</small></span><i className={`ticketStatus ${ticket.status}`}>{statusLabels[ticket.status]}</i><time>{new Date(ticket.last_message_at).toLocaleDateString("fa-IR")}</time></button>)}{!tickets.length && <div className="ticketEmpty"><MessageCircleMore /><b>هنوز گفتگویی ندارید</b><p>{admin ? "تیکت تازه‌ای ثبت نشده است." : "از فرم زیر اولین پیام را برای پشتیبانی بفرستید."}</p></div>}</div>
    </aside>
    <section className="ticketConversation">
      {selected ? <>
        <header><div><small>{admin ? selected.user_email : categoryLabels[selected.category]}</small><h2>{selected.subject}</h2></div>{admin ? <select aria-label="وضعیت تیکت" value={selected.status} onChange={event => changeStatus(event.target.value)}>{Object.entries(statusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select> : <span className={`ticketStatus ${selected.status}`}>{statusLabels[selected.status]}</span>}</header>
        <div className="ticketMessages">{selected.messages.map(message => <article className={message.is_admin_reply ? "adminReply" : "userReply"} key={message.id}><div><b>{message.is_admin_reply ? "پشتیبانی جانِبی" : message.sender_name}</b><time>{new Date(message.created_at).toLocaleString("fa-IR")}</time></div><p>{message.body}</p></article>)}</div>
        {selected.status !== "closed" ? <form className="ticketReplyForm" onSubmit={reply}><label htmlFor="ticket-reply">پاسخ جدید</label><textarea id="ticket-reply" name="message" required placeholder="پیام خود را بنویسید…" /><button className="button primary" disabled={sending}>{sending ? <LoaderCircle className="spin" /> : <Send />} ارسال پیام</button></form> : <div className="ticketClosed">این گفتگو بسته شده است.</div>}
      </> : <div className="conversationEmpty"><Headphones /><h2>گفتگویی انتخاب نشده</h2><p>یک تیکت را از فهرست انتخاب کنید.</p></div>}
    </section>
    {!admin && <form className="newTicketForm" onSubmit={createTicket}><header><Plus /><div><small>گفتگوی تازه</small><h2>ارسال تیکت جدید</h2></div></header><label>موضوع<input name="subject" required maxLength={180} placeholder="مثلاً پیگیری سفارش" /></label><label>دسته‌بندی<select name="category"><option value="general">عمومی</option><option value="order">سفارش</option><option value="payment">پرداخت</option><option value="product">محصول</option></select></label><label>متن پیام<textarea name="message" required placeholder="درخواست خود را با جزئیات بنویسید…" /></label><button className="button primary" disabled={sending}>{sending ? <LoaderCircle className="spin" /> : <Send />} ثبت تیکت</button></form>}
  </div>;
}

export default function SupportTickets({ admin = false }: { admin?: boolean }) {
  return admin ? <AdminShell title="پشتیبانی و تیکت‌ها" eyebrow="گفتگوی مستقیم با مشتریان"><TicketsWorkspace admin /></AdminShell> : <AccountShell><div className="accountSectionHead"><div><span>پشتیبانی آنلاین</span><h1>تیکت‌های پشتیبانی</h1></div><Headphones /></div><TicketsWorkspace admin={false} /></AccountShell>;
}
