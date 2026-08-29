import type { CSSProperties } from "react";
import Image from "next/image";
import type { Brand } from "../lib/types";

const brandThemes: Record<string, [string, string]> = {
  apple: ["#30343b", "#08090c"],
  samsung: ["#2457e6", "#071f7f"],
  xiaomi: ["#ff8a2b", "#e74b00"],
  baseus: ["#303030", "#050505"],
  anker: ["#20a4dc", "#075b87"],
  jbl: ["#ff711c", "#cf3600"],
  sony: ["#304a82", "#06142f"],
};
const fallbacks: [string, string][] = [["#1769c9", "#082c65"], ["#6b45d8", "#2d176d"], ["#008c83", "#034a50"]];

function themeFor(brand: Brand, index: number) {
  const identity = `${brand.name} ${brand.slug}`.toLowerCase();
  return Object.entries(brandThemes).find(([key]) => identity.includes(key))?.[1] || fallbacks[index % fallbacks.length];
}

export default function BrandSection({ brands }: { brands: Brand[] }) {
  return <section className="brandsSection shell homeBrandReplacement">
    <div className="sectionHead"><div><span>انتخاب مطمئن</span><h2>برندهای معتبر</h2></div><a href="/shop">مشاهده همه</a></div>
    <div className="brandGrid">{brands.slice(0, 7).map((brand, index) => {
      const [from, to] = themeFor(brand, index);
      const style = { "--brand-from": from, "--brand-to": to } as CSSProperties;
      return <a className="brandTile" style={style} href={`/shop?brand=${brand.slug}`} key={brand.id}>
        {brand.logo ? <Image src={brand.logo} alt={`لوگوی ${brand.name}`} width={120} height={48} unoptimized /> : <><span>{brand.name.slice(0, 2)}</span><b>{brand.name}</b></>}
      </a>;
    })}</div>
  </section>;
}
