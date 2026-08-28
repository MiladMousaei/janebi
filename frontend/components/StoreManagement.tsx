"use client";

import { CalendarClock, Image, LoaderCircle, Save, Store, TimerReset } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { API_URL } from "../lib/api";
import type { StoreConfiguration } from "../lib/types";
import { notify } from "../lib/notify";
import AdminShell from "./AdminShell";

const empty: StoreConfiguration = { flash_sale_title: "پیشنهاد شگفت‌انگیز", flash_sale_ends_at: null, flash_sale_enabled: true, shop_banner_title: "", shop_banner_subtitle: "", updated_at: "" };
function localDateTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default function StoreManagement() {
  const [config, setConfig] = useState<StoreConfiguration>(empty);
  const [loading, setLoading] = useState(true);
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const headers = useMemo(() => ({ "Content-Type": "application/json", Authorization: `Bearer ${token}` }), [token]);
  useEffect(() => {
    if (!token) { location.href = "/login?next=/admin/store-settings"; return; }
    fetch(`${API_URL}/store-settings/`, { headers }).then(response => response.ok ? response.json() : Promise.reject()).then(setConfig).catch(() => notify("دریافت تنظیمات فروشگاه انجام نشد.", "error")).finally(() => setLoading(false));
  }, [headers, token]);

  async function save(event: FormEvent) {
    event.preventDefault(); setLoading(true);
    const response = await fetch(`${API_URL}/store-settings/`, { method: "PATCH", headers, body: JSON.stringify(config) });
    const body = await response.json();
    if (response.ok) { setConfig(body); notify("تنظیمات فروشگاه ذخیره شد."); }
    else notify(Object.values(body).flat().join("، ") || "ذخیره تنظیمات انجام نشد.", "error");
    setLoading(false);
  }

  return <AdminShell title="مدیریت فروشگاه" eyebrow="کمپین‌ها و ظاهر ویترین">
    <form className="storeSettings" onSubmit={save}>
      <section className="storeSettingsHero"><div><span><Store /></span><div><small>تنظیمات زنده ویترین</small><h2>محتوای مهم فروشگاه را بدون تغییر کد مدیریت کنید</h2><p>تایمر پیشنهاد شگفت‌انگیز و بنر صفحه فروشگاه بلافاصله پس از ذخیره به‌روزرسانی می‌شوند.</p></div></div><button className="button primary" disabled={loading}>{loading ? <LoaderCircle className="spin" /> : <Save />} ذخیره تغییرات</button></section>
      <div className="storeSettingsGrid">
        <section className="storeSettingsCard"><header><span><CalendarClock /></span><div><h3>پیشنهاد شگفت‌انگیز</h3><p>زمان پایان و عنوان کمپین صفحه اصلی</p></div></header><label htmlFor="flash-enabled" className="settingsSwitch"><span className="srOnly">نمایش کمپین پیشنهاد شگفت‌انگیز</span><input id="flash-enabled" type="checkbox" checked={config.flash_sale_enabled} onChange={event => setConfig({ ...config, flash_sale_enabled: event.target.checked })} /><span /><div><b>نمایش کمپین</b><small>در صورت غیرفعال‌بودن، بخش کامل پنهان می‌شود.</small></div></label><label>عنوان پیشنهاد<input value={config.flash_sale_title} onChange={event => setConfig({ ...config, flash_sale_title: event.target.value })} required /></label><label>زمان پایان<input type="datetime-local" value={localDateTime(config.flash_sale_ends_at)} onChange={event => setConfig({ ...config, flash_sale_ends_at: event.target.value ? new Date(event.target.value).toISOString() : null })} required /></label><button type="button" className="timerPreset" onClick={() => setConfig({ ...config, flash_sale_ends_at: new Date(Date.now() + 72 * 3600000).toISOString() })}><TimerReset /> تنظیم سریع برای ۳ روز آینده</button></section>
        <section className="storeSettingsCard"><header><span><Image /></span><div><h3>بنر صفحه فروشگاه</h3><p>تیتر و توضیح بالای صفحه SHOP</p></div></header><label>عنوان بنر<input value={config.shop_banner_title} onChange={event => setConfig({ ...config, shop_banner_title: event.target.value })} required maxLength={160} /></label><label>توضیح بنر<textarea value={config.shop_banner_subtitle} onChange={event => setConfig({ ...config, shop_banner_subtitle: event.target.value })} required maxLength={280} /></label><div className="shopBannerMini"><small>پیش‌نمایش</small><b>{config.shop_banner_title || "عنوان بنر فروشگاه"}</b><p>{config.shop_banner_subtitle || "توضیح کوتاه و جذاب بنر"}</p></div></section>
      </div>
    </form>
  </AdminShell>;
}
