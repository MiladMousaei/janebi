import CatalogPage from "../../../components/CatalogPage";
export default async function Category({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | undefined>> }) { const { slug } = await params; const filters = await searchParams; return <CatalogPage title="محصولات این دسته" path="/shop" params={{ category: slug, ...filters }}/>; }
