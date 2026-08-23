import{Suspense}from"react";import MockPayment from"../../../components/MockPayment";
export default function Payment(){return <main className="paymentPage"><Suspense fallback={<div>در حال بارگذاری…</div>}><MockPayment/></Suspense></main>}
