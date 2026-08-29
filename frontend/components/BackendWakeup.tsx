"use client";
import { useEffect } from "react";
export default function BackendWakeup() {
  useEffect(() => { const controller = new AbortController(); fetch("/api/v1/health/", { cache: "no-store", signal: controller.signal }).catch(() => undefined); return () => controller.abort(); }, []);
  return null;
}
