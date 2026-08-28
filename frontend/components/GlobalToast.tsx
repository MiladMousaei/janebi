"use client";

import { CheckCircle2, CircleAlert, Heart, Info, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { ToastKind } from "../lib/notify";

type ToastItem = { id: number; message: string; kind: ToastKind };

export default function GlobalToast() {
  const [items, setItems] = useState<ToastItem[]>([]);
  useEffect(() => {
    function show(event: Event) {
      const detail = (event as CustomEvent<{ message: string; kind: ToastKind }>).detail;
      if (!detail?.message) return;
      const id = Date.now() + Math.random();
      setItems(current => [...current.slice(-2), { id, ...detail }]);
      window.setTimeout(() => setItems(current => current.filter(item => item.id !== id)), 4200);
    }
    window.addEventListener("janebi:toast", show);
    return () => window.removeEventListener("janebi:toast", show);
  }, []);
  const icons = { success: CheckCircle2, error: CircleAlert, info: Info, favorite: Heart };
  return <div className="globalToastRegion" aria-live="polite" aria-atomic="true">
    {items.map(item => {
      const Icon = icons[item.kind];
      return <div className={`globalToast ${item.kind}`} role={item.kind === "error" ? "alert" : "status"} key={item.id}>
        <span><Icon aria-hidden="true" /></span><p>{item.message}</p>
        <button aria-label="بستن پیام" onClick={() => setItems(current => current.filter(entry => entry.id !== item.id))}><X /></button>
      </div>;
    })}
  </div>;
}
