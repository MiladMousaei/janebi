import Link from "next/link";import AdminShell from "../../../../components/AdminShell";import AdminProductForm from "../../../../components/AdminProductForm";
export default function Create(){return <AdminShell title="ایجاد محصول جدید" eyebrow="کاتالوگ فروشگاه" action={<Link className="button ghost" href="/admin/products">بازگشت</Link>}><AdminProductForm/></AdminShell>}
