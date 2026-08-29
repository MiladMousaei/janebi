import type { Product, Variant } from "./types";

const KEY = "janebi_guest_cart";

export type GuestCartItem = {
  id: number;
  product: Pick<Product, "id" | "name" | "slug" | "primary_image" | "base_price">;
  variant: Variant;
  quantity: number;
};

export function readGuestCart(): GuestCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(value) ? value : [];
  } catch { return []; }
}

function writeGuestCart(items: GuestCartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("janebi:cart-updated"));
}

export function guestCartCount() {
  return readGuestCart().reduce((sum, item) => sum + item.quantity, 0);
}

export function addGuestItem(product: Product, variant: Variant, quantity = 1) {
  const items = readGuestCart();
  const found = items.find(item => item.variant.id === variant.id);
  if (found) found.quantity = Math.min(variant.stock, found.quantity + quantity);
  else items.push({ id: variant.id, product: { id: product.id, name: product.name, slug: product.slug, primary_image: product.primary_image, base_price: product.base_price }, variant, quantity: Math.min(variant.stock, quantity) });
  writeGuestCart(items);
}

export function updateGuestItem(id: number, quantity?: number) {
  const items = readGuestCart();
  const next = quantity === undefined
    ? items.filter(item => item.id !== id)
    : items.map(item => item.id === id ? { ...item, quantity: Math.max(1, Math.min(item.variant.stock, quantity)) } : item);
  writeGuestCart(next);
  return next;
}

export async function mergeGuestCart(token: string) {
  const items = readGuestCart();
  if (!items.length) return;
  for (const item of items) {
    const response = await fetch("/api/v1/cart/add/", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ product: item.product.id, variant: item.variant.id, quantity: item.quantity }),
    });
    if (!response.ok) throw new Error("guest-cart-merge-failed");
  }
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("janebi:cart-updated"));
}
