export type ToastKind = "success" | "error" | "info" | "favorite";

export function notify(message: string, kind: ToastKind = "success") {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("janebi:toast", { detail: { message, kind } }));
  if (kind === "success" && "vibrate" in navigator) navigator.vibrate(12);
}

export function announceCartChange() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("janebi:cart-updated"));
}
