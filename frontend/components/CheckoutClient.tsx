"use client";

import { FormEvent, useEffect, useState } from "react";
import { Check, ChevronDown, FileText, LoaderCircle, MapPin, Plus, ReceiptText, TicketPercent, Truck } from "lucide-react";
import { API_URL, formatPrice } from "../lib/api";
import Notice from "./Notice";

type Address = { id: number; recipient_name: string; phone: string; province: string; city: string; address: string; postal_code: string; plaque: string; unit: string; is_default: boolean };
type Shipping = { id: number; name: string; description: string; price: number; estimated_days: number };
type Order = { id: number; order_number: string; final_amount: number };
type Cart = { items: { id: number; quantity: number; total_price: number; product_detail: { name: string } }[]; subtotal: number; item_count: number };

function errorText(body: unknown, fallback: string) {
  if (!body || typeof body !== "object") return fallback;
  const record = body as Record<string, unknown>;
  const source = record.errors && typeof record.errors === "object" ? record.errors as Record<string, unknown> : record;
  const values = Object.values(source).flatMap(value => Array.isArray(value) ? value : typeof value === "object" && value ? Object.values(value as Record<string, unknown>) : [value]);
  return values.filter(value => typeof value === "string").join("، ") || fallback;
}

export default function CheckoutClient() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [shipping, setShipping] = useState<Shipping[]>([]);
  const [cart, setCart] = useState<Cart | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<number | null>(null);
  const [selectedShipping, setSelectedShipping] = useState<number | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [notice, setNotice] = useState<{ kind: "success" | "error" | "info"; text: string } | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingAddress, setSavingAddress] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;

  useEffect(() => {
    if (!token) { location.href = "/login?next=/checkout"; return; }
    Promise.all([
      fetch(`${API_URL}/auth/addresses/`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_URL}/shipping-methods/`),
      fetch(`${API_URL}/cart/`, { headers: { Authorization: `Bearer ${token}` } }),
    ]).then(async ([addressResponse, shippingResponse, cartResponse]) => {
      if (!addressResponse.ok || !shippingResponse.ok || !cartResponse.ok) throw new Error();
      const [addressData, shippingData, cartData] = await Promise.all([addressResponse.json(), shippingResponse.json(), cartResponse.json()]);
      const nextAddresses: Address[] = addressData.results || addressData;
      const nextShipping: Shipping[] = shippingData.results || shippingData;
      setAddresses(nextAddresses);
      setShipping(nextShipping);
      setCart(cartData);
      setSelectedAddress(nextAddresses.find(item => item.is_default)?.id || nextAddresses[0]?.id || null);
      setSelectedShipping(nextShipping[0]?.id || null);
      setShowAddressForm(nextAddresses.length === 0);
    }).catch(() => setNotice({ kind: "error", text: "دریافت اطلاعات تسویه حساب انجام نشد. دوباره تلاش کنید." }))
      .finally(() => setLoading(false));
  }, [token]);

  async function createAddress(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setSavingAddress(true); setNotice(null);
    const form = event.currentTarget;
    const payload = { ...Object.fromEntries(new FormData(form)), is_default: true };
    try {
      const response = await fetch(`${API_URL}/auth/addresses/`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
      const body = await response.json();
      if (!response.ok) throw new Error(errorText(body, "ذخیره آدرس انجام نشد."));
      setAddresses(previous => [body, ...previous.map(item => ({ ...item, is_default: false }))]);
      setSelectedAddress(body.id);
      setShowAddressForm(false);
      form.reset();
      setNotice({ kind: "success", text: "آدرس با موفقیت ذخیره و برای این سفارش انتخاب شد." });
    } catch (error) { setNotice({ kind: "error", text: error instanceof Error ? error.message : "ذخیره آدرس انجام نشد." }); }
    finally { setSavingAddress(false); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedAddress) { setShowAddressForm(true); setNotice({ kind: "error", text: "ابتدا آدرس تحویل را کامل و ذخیره کنید." }); return; }
    if (!selectedShipping) { setNotice({ kind: "error", text: "یک روش ارسال انتخاب کنید." }); return; }
    setSubmitting(true); setNotice({ kind: "info", text: "در حال بررسی موجودی و ثبت سفارش…" });
    const data = Object.fromEntries(new FormData(event.currentTarget));
    const payload = { ...data, address_id: selectedAddress, shipping_method_id: selectedShipping };
    try {
      const response = await fetch(`${API_URL}/orders/checkout/`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
      const body = await response.json();
      if (!response.ok) throw new Error(errorText(body, "ثبت سفارش ممکن نشد؛ موجودی و اطلاعات را بررسی کنید."));
      setOrder(body); setNotice(null);
    } catch (error) { setNotice({ kind: "error", text: error instanceof Error ? error.message : "ثبت سفارش انجام نشد." }); }
    finally { setSubmitting(false); }
  }

  async function pay() {
    if (!order) return;
    const response = await fetch(`${API_URL}/payments/create_payment/`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify({ order_id: order.id }) });
    const payment = await response.json();
    if (response.ok) location.href = `/payment/mock?authority=${payment.authority}&amount=${payment.amount}`;
    else setNotice({ kind: "error", text: errorText(payment, "ایجاد درگاه پرداخت انجام نشد.") });
  }

  if (loading) return <div className="checkoutLoading"><LoaderCircle className="spin" /><b>در حال آماده‌سازی تسویه حساب…</b></div>;
  if (order) return <div className="successCard"><span><Check /></span><h2>سفارش با موفقیت ثبت شد</h2><p>شماره سفارش: {order.order_number}</p><b>{formatPrice(order.final_amount)}</b>{notice && <Notice kind={notice.kind}>{notice.text}</Notice>}<button className="button primary" onClick={pay}>پرداخت آزمایشی</button></div>;

  const chosenShipping = shipping.find(method => method.id === selectedShipping);
  const shippingCost = Number(chosenShipping?.price || 0);
  const payable = Number(cart?.subtotal || 0) + shippingCost;

  return <div className="checkoutWorkspace">
    <div className="checkoutForm">
      <section className="step checkoutStep"><span><MapPin /></span><div><header><div><small>مرحله اول</small><h2>آدرس تحویل</h2></div>{addresses.length > 0 && <button type="button" className="textButton" onClick={() => setShowAddressForm(value => !value)}><Plus size={17} /> آدرس جدید <ChevronDown size={16} /></button>}</header>
        {addresses.length > 0 && <div className="addressOptions">{addresses.map(address => <label className={`option ${selectedAddress === address.id ? "selected" : ""}`} key={address.id}><input type="radio" name="address_id" value={address.id} checked={selectedAddress === address.id} onChange={() => setSelectedAddress(address.id)} /><b>{address.recipient_name} · {address.phone}</b><small>{address.province}، {address.city}، {address.address}، پلاک {address.plaque}</small>{selectedAddress === address.id && <Check className="optionCheck" />}</label>)}</div>}
        {showAddressForm && <form className="inlineAddressForm" onSubmit={createAddress}><div className="inlineFormTitle"><MapPin /><div><b>{addresses.length ? "افزودن آدرس تازه" : "اطلاعات آدرس را همین‌جا وارد کنید"}</b><small>پس از ذخیره، این آدرس خودکار برای سفارش انتخاب می‌شود.</small></div></div><div className="addressFields"><label>نام گیرنده<input name="recipient_name" required /></label><label>شماره موبایل<input name="phone" inputMode="tel" required /></label><label>استان<input name="province" required /></label><label>شهر<input name="city" required /></label><label>کد پستی<input name="postal_code" inputMode="numeric" required /></label><label>پلاک<input name="plaque" required /></label><label>واحد<input name="unit" /></label><label className="wide">نشانی کامل<textarea name="address" required /></label></div><button className="button addressSave" disabled={savingAddress}>{savingAddress ? <LoaderCircle className="spin" /> : <Check />} ذخیره و انتخاب آدرس</button></form>}
      </div></section>
      <section className="step checkoutStep"><span><Truck /></span><div><header><div><small>مرحله دوم</small><h2>روش ارسال</h2></div></header>{shipping.length ? shipping.map(method => <label className={`option shippingOption ${selectedShipping === method.id ? "selected" : ""}`} key={method.id}><input type="radio" name="shipping_method_id" value={method.id} checked={selectedShipping === method.id} onChange={() => setSelectedShipping(method.id)} /><b>{method.name}</b><small>{method.description} · حدود {method.estimated_days.toLocaleString("fa-IR")} روز</small><strong>{method.price ? formatPrice(method.price) : "رایگان"}</strong></label>) : <Notice kind="warning">روش ارسال فعالی وجود ندارد؛ با پشتیبانی تماس بگیرید.</Notice>}</div></section>
      <form className="checkoutFinalize" onSubmit={submit}>
        <section className="step checkoutStep"><span><TicketPercent /></span><div><header><div><small>مرحله سوم</small><h2>کد تخفیف</h2></div></header><input className="couponInput" name="coupon_code" placeholder="مثلاً WELCOME10" /></div></section>
        {notice && <Notice kind={notice.kind} title={notice.kind === "error" ? "ثبت سفارش نیاز به توجه دارد" : undefined}>{notice.text}</Notice>}
        <button className="button primary checkoutSubmit" disabled={submitting || !shipping.length}>{submitting ? <><LoaderCircle className="spin" /> در حال ثبت سفارش…</> : "ثبت نهایی سفارش"}</button>
      </form>
    </div>
    <aside className="checkoutAside">
      <section className="checkoutInvoice"><header><span><ReceiptText /></span><div><small>فاکتور شما</small><h2>خلاصه سفارش</h2></div></header><div className="invoiceItems">{cart?.items.slice(0, 4).map(item => <div key={item.id}><span>{item.product_detail.name}<small>{item.quantity.toLocaleString("fa-IR")} عدد</small></span><b>{formatPrice(item.total_price)}</b></div>)}{!cart?.items.length && <p>سبد خرید شما خالی است.</p>}</div><div className="invoiceRow"><span>جمع کالاها ({cart?.item_count.toLocaleString("fa-IR") || "۰"})</span><b>{formatPrice(cart?.subtotal || 0)}</b></div><div className="invoiceRow"><span>هزینه ارسال</span><b>{shippingCost ? formatPrice(shippingCost) : "رایگان"}</b></div><div className="invoiceTotal"><span>مبلغ قابل پرداخت</span><b>{formatPrice(payable)}</b></div><small className="invoiceHint"><FileText /> مبلغ نهایی پس از اعمال کد تخفیف به‌روزرسانی می‌شود.</small></section>
      <section className="checkoutHelp"><Truck /><h3>خریدت در مسیر امن است</h3><p>موجودی و مبلغ سفارش پیش از ثبت نهایی دوباره بررسی می‌شود.</p><div><span>ارسال قابل پیگیری</span><b>ضمانت اصالت</b></div></section>
    </aside>
  </div>;
}
