import type { Metadata } from "next";
import "@fontsource-variable/vazirmatn";
import "./globals.css";
import ScrollExperience from "../components/ScrollExperience";
import GlobalToast from "../components/GlobalToast";
import BackendWakeup from "../components/BackendWakeup";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "جانِبی | فروشگاه گجت و لوازم جانبی موبایل",
  description: "خرید آنلاین لوازم جانبی موبایل و گجت‌های کاربردی با تضمین اصالت و ارسال سریع.",
  keywords: ["لوازم جانبی موبایل", "گجت", "هدفون", "شارژر", "کابل", "فروشگاه جانبی"],
  applicationName: "جانِبی",
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  openGraph: {
    title: "جانِبی | گجت‌هایی که روزت را بهتر می‌کنند",
    description: "لوازم جانبی موبایل و گجت‌های اصل با ارسال سریع.",
    locale: "fa_IR",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "بهترین لوازم جانبی موبایل در فروشگاه جانبی" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "جانِبی | گجت‌هایی که روزت را بهتر می‌کنند",
    description: "لوازم جانبی موبایل و گجت‌های اصل با ارسال سریع.",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const structuredData = { "@context": "https://schema.org", "@type": "OnlineStore", name: "جانِبی", url: site, description: "فروشگاه آنلاین گجت و لوازم جانبی موبایل", inLanguage: "fa-IR" };
  return <html lang="fa" dir="rtl" data-scroll-behavior="smooth"><body><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} /><BackendWakeup /><ScrollExperience /><GlobalToast />{children}</body></html>;
}
