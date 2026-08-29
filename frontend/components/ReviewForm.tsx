"use client";

import { FormEvent, useState } from "react";
import { LoaderCircle, MessageSquarePlus, Send, Star } from "lucide-react";
import { authFetch } from "../lib/authFetch";
import { notify } from "../lib/notify";

export default function ReviewForm({ productId, productSlug }: { productId: number; productSlug: string }) {
  const [rating, setRating] = useState(5);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!localStorage.getItem("access_token")) {
      location.href = `/login?next=/product/${productSlug}`;
      return;
    }
    setSending(true);
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    const response = await authFetch("/reviews/", {
      method: "POST",
      body: JSON.stringify({ product: productId, rating, title: data.title, comment: data.comment }),
    });
    const body = await response.json().catch(() => ({}));
    if (response.ok) {
      form.reset(); setRating(5); setSent(true);
      notify("نظر شما ثبت شد و پس از بررسی نمایش داده می‌شود.");
    } else {
      const message = Object.values(body).flat().join("، ") || "ثبت نظر انجام نشد.";
      notify(message, "error");
    }
    setSending(false);
  }

  return <section className="reviewComposer" aria-labelledby="review-form-title">
    <header><span><MessageSquarePlus aria-hidden="true" /></span><div><small>تجربه خرید شما</small><h3 id="review-form-title">نظر خود را ثبت کنید</h3><p>نظر خریداران تحویل‌گرفته پس از بررسی منتشر می‌شود.</p></div></header>
    {sent ? <div className="reviewSuccess"><Star aria-hidden="true" /> نظر شما برای بررسی ارسال شد.</div> : <form onSubmit={submit}>
      <fieldset className="reviewRating"><legend>امتیاز شما</legend>{[5, 4, 3, 2, 1].map(value => <label className={rating === value ? "active" : ""} key={value}><input type="radio" name="rating" value={value} checked={rating === value} onChange={() => setRating(value)} /><Star aria-hidden="true" /> <span>{value.toLocaleString("fa-IR")}</span></label>)}</fieldset>
      <label>عنوان نظر<input name="title" required maxLength={160} placeholder="مثلاً کیفیت عالی و ارسال سریع" /></label>
      <label>متن نظر<textarea name="comment" required minLength={10} placeholder="تجربه خود از کیفیت، بسته‌بندی و استفاده از محصول را بنویسید…" /></label>
      <button className="button primary" disabled={sending}>{sending ? <LoaderCircle className="spin" /> : <Send aria-hidden="true" />} ارسال نظر</button>
    </form>}
  </section>;
}
