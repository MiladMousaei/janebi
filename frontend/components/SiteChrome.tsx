import Link from "next/link";
import { getStoreConfiguration } from "../lib/api";
import MobileNav from "./MobileNav";
import SiteHeader from "./SiteHeader";

export default async function SiteChrome({ children }: { children: React.ReactNode }) {
  const configuration = await getStoreConfiguration();
  return <>
    <a className="skipLink" href="#main-content">رفتن به محتوای اصلی</a>
    <SiteHeader supportPhone={configuration.support_phone} />
    <div id="main-content" tabIndex={-1}>{children}</div>
    <footer className="footer"><div className="shell footerGrid">
      <div className="footerIntro"><Link className="brand" href="/"><span className="brandMark">ج</span> جانِبی</Link><p>انتخاب مطمئن گجت و لوازم جانبی اصل با ارسال سریع.</p></div>
      <div><b>خرید</b><Link href="/shop">فروشگاه</Link><Link href="/shop?discount=true">تخفیف‌ها</Link><Link href="/account/orders">پیگیری سفارش</Link></div>
      <div><b>اعتماد و راهنما</b><Link href="/faq">سوالات متداول</Link><Link href="/shipping">روش‌های ارسال</Link><Link href="/returns">شرایط بازگشت</Link><Link href="/terms">قوانین</Link><Link href="/privacy">حریم خصوصی</Link></div>
      <div><Link className="footerContactLink" href="/contact"><b>ارتباط با ما</b></Link>{configuration.support_phone && <a href={`tel:${configuration.support_phone}`} dir="ltr">{configuration.support_phone}</a>}{configuration.support_email && <a href={`mailto:${configuration.support_email}`}>{configuration.support_email}</a>}<small>{configuration.support_hours}</small><Link href="/account/tickets">ارسال تیکت پشتیبانی</Link></div>
    </div></footer>
    <MobileNav />
  </>;
}
