"use client";

import { FormEvent, InputHTMLAttributes, useState } from "react";
import { API_URL } from "../lib/api";
import { mergeGuestCart } from "../lib/guestCart";

type Mode = "login" | "register";
type FieldErrors = Record<string, string>;

const labels: Record<string, string> = {
  first_name: "نام", last_name: "نام خانوادگی", phone: "شماره موبایل", email: "ایمیل",
  identifier: "ایمیل یا شماره موبایل", password: "رمز عبور", confirm_password: "تکرار رمز عبور",
};

function validateField(name: string, value: string, values: Record<string, string>, mode: Mode) {
  const required = mode === "login" ? ["identifier", "password"] : ["first_name", "last_name", "phone", "password", "confirm_password"];
  if (required.includes(name) && !value.trim()) return `${labels[name]} را وارد کنید.`;
  if (name === "email" && value.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return "ایمیل واردشده معتبر نیست.";
  if (name === "phone" && value.trim() && !/^09\d{9}$/.test(value.trim())) return "شماره موبایل را به صورت ۱۱ رقمی وارد کنید.";
  if (name === "password" && mode === "register" && value.length > 0 && value.length < 6) return "رمز عبور باید حداقل ۶ کاراکتر باشد.";
  if (name === "confirm_password" && value && value !== values.password) return "تکرار رمز عبور با رمز عبور یکسان نیست.";
  return "";
}

function apiErrors(body: unknown): FieldErrors {
  if (!body || typeof body !== "object") return {};
  const record = body as Record<string, unknown>;
  const source = typeof record.errors === "object" && record.errors ? record.errors as Record<string, unknown> : record;
  return Object.fromEntries(Object.entries(source).map(([key, value]) => [key, Array.isArray(value) ? String(value[0]) : String(value)]));
}

export default function AuthForm({ mode }: { mode: Mode }) {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);

  function validateElement(input: HTMLInputElement, form: HTMLFormElement) {
    const values = Object.fromEntries(new FormData(form)) as Record<string, string>;
    setErrors(current => ({ ...current, [input.name]: validateField(input.name, input.value, values, mode) }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>;
    const names = mode === "login" ? ["identifier", "password"] : ["first_name", "last_name", "phone", "email", "password", "confirm_password"];
    const nextErrors = Object.fromEntries(names.map(name => [name, validateField(name, data[name] || "", data, mode)]).filter(([, value]) => value));
    setErrors(nextErrors);
    setGeneralError("");
    if (Object.keys(nextErrors).length) {
      form.querySelector<HTMLInputElement>(`[name="${Object.keys(nextErrors)[0]}"]`)?.focus();
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/${mode}/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        const responseErrors = apiErrors(body);
        const known = Object.fromEntries(Object.entries(responseErrors).filter(([key]) => names.includes(key)));
        setErrors(known);
        setGeneralError(responseErrors.non_field_errors || responseErrors.detail || (Object.keys(known).length ? "" : "اطلاعات واردشده معتبر نیست."));
        form.querySelector<HTMLInputElement>(`[name="${Object.keys(known)[0] || names[0]}"]`)?.focus();
        return;
      }
      if (mode === "login") {
        localStorage.setItem("access_token", body.access);
        localStorage.setItem("refresh_token", body.refresh);
        localStorage.setItem("user", JSON.stringify(body.user));
        try { await mergeGuestCart(body.access); } catch { /* سبد مهمان در صورت خطای موجودی برای تلاش بعدی حفظ می‌شود. */ }
        location.href = new URLSearchParams(location.search).get("next") || "/account";
      } else location.href = "/login?registered=1";
    } catch {
      setGeneralError("ارتباط با سرور برقرار نشد؛ دوباره تلاش کنید.");
    } finally {
      setLoading(false);
    }
  }

  const field = (name: string, title: string, props: InputHTMLAttributes<HTMLInputElement> = {}) => <label htmlFor={`auth-${name}`}>{title}<input id={`auth-${name}`} name={name} aria-invalid={Boolean(errors[name])} aria-describedby={errors[name] ? `auth-${name}-error` : undefined} onBlur={event => validateElement(event.currentTarget, event.currentTarget.form!)} {...props} />{errors[name] && <small className="fieldError" id={`auth-${name}-error`} role="alert">{errors[name]}</small>}</label>;

  return <form className="authForm" onSubmit={submit} noValidate>
    {mode === "register" && <div className="twoCols">{field("first_name", "نام")}{field("last_name", "نام خانوادگی")}</div>}
    {mode === "register" ? <>{field("phone", "شماره موبایل", { inputMode: "tel", autoComplete: "tel", placeholder: "09121234567", dir: "ltr" })}{field("email", "ایمیل (اختیاری)", { type: "email", autoComplete: "email", placeholder: "name@example.com", dir: "ltr" })}</> : field("identifier", "ایمیل یا شماره موبایل", { autoComplete: "username", dir: "ltr" })}
    {field("password", "رمز عبور", { type: "password", minLength: mode === "register" ? 6 : undefined, autoComplete: mode === "register" ? "new-password" : "current-password", placeholder: mode === "register" ? "حداقل ۶ کاراکتر" : undefined })}
    {mode === "register" && field("confirm_password", "تکرار رمز عبور", { type: "password", minLength: 6, autoComplete: "new-password" })}
    {generalError && <div className="formError" role="alert">{generalError}</div>}
    <button className="button primary" disabled={loading}>{loading ? "لطفاً صبر کنید…" : mode === "login" ? "ورود به حساب" : "ساخت حساب"}</button>
    {mode === "login" ? <p>حساب ندارید؟ <a href="/register">ثبت‌نام کنید</a></p> : <p>قبلاً ثبت‌نام کرده‌اید؟ <a href="/login">وارد شوید</a></p>}
  </form>;
}
