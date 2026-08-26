"use client";

import { BrainCircuit, Clock3, RefreshCw, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { API_URL } from "../lib/api";

type ForecastState = {
  used_today: number;
  remaining_today: number;
  latest: null | { content: string; model: string; created_at: string };
  detail?: string;
};

export default function SalesForecastCard() {
  const [data, setData] = useState<ForecastState | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/admin/sales-forecast/`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async response => ({ ok: response.ok, body: await response.json() }))
      .then(({ ok, body }) => { if (ok) setData(body); else setMessage(body.detail || "دریافت پیش‌بینی ممکن نشد."); })
      .catch(() => setMessage("ارتباط با سرویس پیش‌بینی برقرار نشد."))
      .finally(() => setLoading(false));
  }, [token]);

  async function generate() {
    if (!token || data?.remaining_today === 0) return;
    setLoading(true); setMessage("");
    try {
      const response = await fetch(`${API_URL}/admin/sales-forecast/`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
      const body = await response.json();
      setData(body);
      if (!response.ok) setMessage(body.detail || "ساخت پیش‌بینی انجام نشد.");
    } catch { setMessage("ارتباط با سرویس پیش‌بینی برقرار نشد."); }
    finally { setLoading(false); }
  }

  return <section className="aiForecastPanel">
    <div className="aiForecastHeader">
      <div className="aiForecastTitle"><span><BrainCircuit size={25} /></span><div><small>تحلیل اختصاصی با ChatGPT</small><h2>پیش‌بینی هوشمند فروش</h2></div></div>
      <div className="aiForecastActions"><span><Clock3 size={16} /> {data ? `${data.remaining_today.toLocaleString("fa-IR")} نوبت باقی‌مانده امروز` : "روزانه ۲ نوبت"}</span><button onClick={generate} disabled={loading || data?.remaining_today === 0}>{loading ? <RefreshCw className="spin" size={18} /> : <Sparkles size={18} />}{data?.latest ? "تحلیل تازه" : "ساخت پیش‌بینی"}</button></div>
    </div>
    {message && <p className="aiForecastMessage">{message}</p>}
    {data?.latest ? <div className="aiForecastContent"><div className="aiForecastMeta">آخرین تحلیل: {new Date(data.latest.created_at).toLocaleString("fa-IR")}</div><div>{data.latest.content}</div></div> : !loading && !message ? <div className="aiForecastEmpty"><Sparkles size={24} /><p>با تحلیل فروش ۳۰ روز گذشته، روند ۷ و ۳۰ روز آینده و اقدام‌های پیشنهادی را دریافت کنید.</p></div> : null}
  </section>;
}
