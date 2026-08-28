import type{Brand,Category,HomeData,Paginated,StoreConfiguration}from"./types";
const internalApi=process.env.INTERNAL_API_URL||(process.env.INTERNAL_API_HOSTPORT?`http://${process.env.INTERNAL_API_HOSTPORT}/api/v1`:"http://127.0.0.1:8000/api/v1");
export const API_URL=process.env.NEXT_PUBLIC_API_URL||(typeof window==="undefined"?internalApi:"/api/v1");
export async function apiFetch<T>(path:string,options:RequestInit={}):Promise<T>{const response=await fetch(`${API_URL}${path}`,{...options,headers:{"Content-Type":"application/json",...options.headers},cache:"no-store"});if(!response.ok)throw new Error(`API error ${response.status}`);return response.json()as Promise<T>}
export async function safeFetch<T>(path:string,fallback:T):Promise<T>{try{return await apiFetch<T>(path)}catch{return fallback}}
export const getHome=()=>safeFetch<HomeData>("/products/home/",{featured:[],new:[],best_sellers:[],offers:[]});
export const getCategories=()=>safeFetch<Paginated<Category>|Category[]>("/categories/?page_size=60",[]);
export const getBrands=()=>safeFetch<Paginated<Brand>|Brand[]>("/brands/?page_size=60",[]);
export const getStoreConfiguration=()=>safeFetch<StoreConfiguration>("/store-settings/",{flash_sale_title:"پیشنهاد شگفت‌انگیز",flash_sale_ends_at:null,flash_sale_enabled:true,shop_banner_title:"همه‌چیز برای یک انتخاب هوشمندانه",shop_banner_subtitle:"جدیدترین گجت‌ها و لوازم جانبی اصل را با ارسال سریع و ضمانت واقعی پیدا کنید.",updated_at:""});
export function listOf<T>(value:Paginated<T>|T[]):T[]{return Array.isArray(value)?value:value.results}
export const formatPrice=(value:number)=>`${new Intl.NumberFormat("fa-IR").format(value)} تومان`;
