"use client";

import { BatteryCharging, BatteryFull, Cable, Fan, Headphones, Mic2, PlugZap, Radio, ShieldCheck, Smartphone, Speaker, Watch } from "lucide-react";
import { useState } from "react";

type Visual = { kind: string; label: string; Icon: typeof Smartphone };

function visualFor(name: string): Visual {
  const title = name.toLowerCase();
  if (title.includes("هولدر") || title.includes("نگهدارنده")) return { kind: "holder", label: "هولدر موبایل", Icon: Smartphone };
  if (title.includes("پاوربانک")) return { kind: "powerbank", label: "پاوربانک", Icon: BatteryFull };
  if (title.includes("شارژر وایرلس") || title.includes("شارژ بی‌سیم")) return { kind: "wireless", label: "شارژر بی‌سیم", Icon: Radio };
  if (title.includes("آداپتور") || title.includes("شارژر")) return { kind: "charger", label: "شارژر", Icon: PlugZap };
  if (title.includes("کابل")) return { kind: "cable", label: "کابل شارژ", Icon: Cable };
  if (title.includes("هندزفری") || title.includes("ایرباد")) return { kind: "earbuds", label: "هندزفری بی‌سیم", Icon: Headphones };
  if (title.includes("هدفون")) return { kind: "headphones", label: "هدفون", Icon: Headphones };
  if (title.includes("اسپیکر")) return { kind: "speaker", label: "اسپیکر", Icon: Speaker };
  if (title.includes("ساعت")) return { kind: "watch", label: "ساعت هوشمند", Icon: Watch };
  if (title.includes("میکروفون")) return { kind: "microphone", label: "میکروفون", Icon: Mic2 };
  if (title.includes("فن") || title.includes("خنک")) return { kind: "cooler", label: "خنک‌کننده", Icon: Fan };
  if (title.includes("گلس") || title.includes("محافظ صفحه")) return { kind: "glass", label: "محافظ صفحه", Icon: ShieldCheck };
  if (title.includes("قاب") || title.includes("کاور")) return { kind: "case", label: "قاب موبایل", Icon: Smartphone };
  return { kind: "gadget", label: "گجت دیجیتال", Icon: BatteryCharging };
}

export default function ProductVisual({ name, image, className = "", decorative = false }: { name: string; slug?: string; image?: string | null; className?: string; decorative?: boolean }) {
  const [failed, setFailed] = useState(false);
  const visual = visualFor(name);
  if (image && !failed) return <img className={`productVisual ${className}`} src={image} alt={decorative ? "" : name} loading="lazy" decoding="async" referrerPolicy="no-referrer" onError={() => setFailed(true)} />;
  const Icon = visual.Icon;
  return <span className={`semanticProductVisual ${className}`} data-kind={visual.kind} role={decorative ? undefined : "img"} aria-hidden={decorative || undefined} aria-label={decorative ? undefined : `تصویر ${visual.label}: ${name}`}><span className="semanticProductIcon"><Icon aria-hidden="true" strokeWidth={1.65} /></span><small>{visual.label}</small></span>;
}
