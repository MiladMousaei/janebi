import { API_URL } from "./api";
import type { Product } from "./types";

export type WishlistEntry = { id: number; product: number; product_detail: Product; created_at: string };

let cache: { token: string; entries: WishlistEntry[] } | null = null;
let pending: Promise<WishlistEntry[]> | null = null;

export async function getWishlist(token: string, force = false) {
  if (!force && cache?.token === token) return cache.entries;
  if (!force && pending) return pending;
  pending = fetch(`${API_URL}/wishlist/`, { headers: { Authorization: `Bearer ${token}` } })
    .then(async response => {
      if (!response.ok) throw new Error("wishlist_load_failed");
      const body = await response.json();
      const entries: WishlistEntry[] = body.results || body;
      cache = { token, entries };
      return entries;
    })
    .finally(() => { pending = null; });
  return pending;
}

export async function setWishlistProduct(token: string, productId: number, shouldSave: boolean) {
  const entries = await getWishlist(token);
  const current = entries.find(entry => entry.product === productId);
  if (shouldSave && !current) {
    const response = await fetch(`${API_URL}/wishlist/add/`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ product: productId }),
    });
    if (!response.ok) throw new Error("wishlist_save_failed");
    const created: WishlistEntry = await response.json();
    cache = { token, entries: [created, ...entries] };
  } else if (!shouldSave && current) {
    const response = await fetch(`${API_URL}/wishlist/${current.id}/remove/`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok && response.status !== 204) throw new Error("wishlist_remove_failed");
    cache = { token, entries: entries.filter(entry => entry.id !== current.id) };
  }
  window.dispatchEvent(new CustomEvent("janebi:wishlist-updated", { detail: { productId, saved: shouldSave } }));
  return shouldSave;
}

export function invalidateWishlist() {
  cache = null;
}
