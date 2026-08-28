import Link from "next/link";
import MobileNav from "./MobileNav";
import SiteHeader from "./SiteHeader";

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  return <><SiteHeader />{children}<footer className="footer"><div className="shell footerGrid"><div className="footerIntro"><Link className="brand" href="/"><span className="brandMark">ج</span> جانِبی</Link><p>انتخاب مطمئن گجت و لوازم جانبی اصل با ارسال سریع.</p></div><div><b>خرید</b><Link href="/shop">فروشگاه</Link><Link href="/shop?discount=true">تخفیف‌ها</Link><Link href="/account/orders">پیگیری سفارش</Link></div><div><b>راهنما</b><Link href="/faq">سوالات متداول</Link><Link href="/terms">قوانین</Link><Link href="/privacy">حریم خصوصی</Link></div><div><b>ارتباط</b><span>۰۲۱-۹۱۰۰۱۲۳۴</span><span>support@janebi.ir</span></div></div></footer><MobileNav /></>;
}
