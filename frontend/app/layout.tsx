import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "جانِبی | فروشگاه گجت و لوازم جانبی موبایل",
  description: "خرید آنلاین لوازم جانبی موبایل و گجت‌های کاربردی با تضمین اصالت و ارسال سریع.",
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
  return <html lang="fa" dir="rtl"><body>{children}</body></html>;
}
