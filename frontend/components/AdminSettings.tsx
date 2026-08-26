"use client";

import { KeyRound, Save, UserRound } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { API_URL } from "../lib/api";
import AdminShell from "./AdminShell";

type Profile = { first_name: string; last_name: string; email: string; phone: string };
const emptyProfile: Profile = { first_name: "", last_name: "", email: "", phone: "" };

export default function AdminSettings() {
  const [profile, setProfile] = useState<Profile>(emptyProfile);
  const [passwords, setPasswords] = useState({ old_password: "", new_password: "" });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  useEffect(() => {
    if (!token) { location.href = "/login?next=/admin/settings"; return; }
    fetch(`${API_URL}/auth/profile/`, { headers: { Authorization: `Bearer ${token}` } })
      .then(response => response.ok ? response.json() : Promise.reject())
      .then(setProfile).catch(() => setMessage("دریافت اطلاعات حساب انجام نشد.")).finally(() => setLoading(false));
  }, [token]);

  async function saveProfile(event: FormEvent) {
    event.preventDefault(); setLoading(true); setMessage("");
    const response = await fetch(`${API_URL}/auth/profile/`, { method: "PATCH", headers, body: JSON.stringify(profile) });
    const body = await response.json();
    if (response.ok) { setProfile(body); setMessage("اطلاعات مدیر با موفقیت ذخیره شد."); }
    else setMessage(Object.values(body).flat().join(" ") || "ذخیره اطلاعات انجام نشد.");
    setLoading(false);
  }

  async function changePassword(event: FormEvent) {
    event.preventDefault(); setLoading(true); setMessage("");
    const response = await fetch(`${API_URL}/auth/change-password/`, { method: "POST", headers, body: JSON.stringify(passwords) });
    const body = await response.json();
    if (response.ok) { setPasswords({ old_password: "", new_password: "" }); setMessage(body.detail); }
    else setMessage(Object.values(body).flat().join(" ") || "تغییر رمز انجام نشد.");
    setLoading(false);
  }

  return <AdminShell title="اطلاعات مدیر" eyebrow="امنیت و پروفایل">
    {message && <div className="settingsNotice" role="status">{message}</div>}
    <div className="adminSettingsGrid">
      <form className="adminSettingsCard" onSubmit={saveProfile}><header><span><UserRound /></span><div><h2>مشخصات حساب</h2><p>اطلاعات نمایش‌داده‌شده و راه‌های ارتباطی مدیر را ویرایش کنید.</p></div></header>
        <div className="settingsFields"><label>نام<input required value={profile.first_name} onChange={e => setProfile({ ...profile, first_name: e.target.value })} /></label><label>نام خانوادگی<input required value={profile.last_name} onChange={e => setProfile({ ...profile, last_name: e.target.value })} /></label><label>ایمیل<input dir="ltr" type="email" required value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} /></label><label>شماره موبایل<input dir="ltr" value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} /></label></div>
        <button className="button primary" disabled={loading}><Save size={18} /> ذخیره تغییرات</button>
      </form>
      <form className="adminSettingsCard security" onSubmit={changePassword}><header><span><KeyRound /></span><div><h2>تغییر رمز عبور</h2><p>برای امنیت بیشتر، یک رمز حداقل ۸ کاراکتری انتخاب کنید.</p></div></header>
        <label>رمز فعلی<input type="password" required value={passwords.old_password} onChange={e => setPasswords({ ...passwords, old_password: e.target.value })} /></label><label>رمز جدید<input type="password" minLength={8} required value={passwords.new_password} onChange={e => setPasswords({ ...passwords, new_password: e.target.value })} /></label>
        <button className="button dark" disabled={loading}><KeyRound size={18} /> به‌روزرسانی رمز</button>
      </form>
    </div>
  </AdminShell>;
}
