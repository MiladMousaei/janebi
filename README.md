# فروشگاه اینترنتی جانِبی

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/MiladMousaei/janebi)

جانِبی یک فروشگاه فارسی، RTL و API-first برای فروش لوازم جانبی موبایل و گجت‌های دیجیتال است. رابط کاربری با React، TypeScript و App Router ساخته شده و همه‌ی داده‌های تجاری از Django REST API دریافت می‌شوند. قیمت، تخفیف، موجودی، کوپن و مبلغ پرداخت همیشه در سرور محاسبه می‌شوند.

## معماری

- `frontend/`: رابط responsive فروشگاه، حساب مشتری، checkout و پنل مدیریت
- `backend/apps/users/`: کاربر سفارشی، JWT، پروفایل و آدرس‌ها
- `backend/apps/catalog/`: دسته‌بندی درختی، برند، محصول، تصویر، تنوع انعطاف‌پذیر، ویژگی و نظر
- `backend/apps/commerce/`: سبد، علاقه‌مندی، کوپن، سفارش، موجودی تراکنشی، پرداخت و اعلان
- PostgreSQL منبع اصلی داده است؛ SQLite فقط برای اجرای سریع check و test محلی پشتیبانی می‌شود.

## امکانات نسخه کامل

- صفحه خانه با بنر اسلایدی خودکار، تصاویر واقعی محصول، پیشنهادهای شگفت‌انگیز و دسته‌بندی‌های پویا
- جستجوی لحظه‌ای با پیشنهاد محصول و صفحه نتایج مستقل
- فیلتر ترکیبی دسته، برند، قیمت، امتیاز، موجودی و تخفیف با مرتب‌سازی و صفحه‌بندی
- سبد خرید، علاقه‌مندی، حساب مشتری، آدرس‌ها، checkout، کوپن و پرداخت آزمایشی امن
- پنل مدیریت اختصاصی برای داشبورد فروش، محصول و تصویر، قیمت، موجودی، سفارش، کاربر، برند، دسته، کوپن و نظرات
- API مستند، JWT، کنترل دسترسی مدیر، PostgreSQL و استقرار Docker چندسرویسی

## فناوری‌ها

Next.js 16 با App Router، React 19، TypeScript strict، Tailwind CSS 4، Django 5.2، Django REST Framework، Simple JWT، django-filter، drf-spectacular، PostgreSQL 17، Pillow، pytest و Docker Compose.

## نیازمندی‌ها

- Docker Desktop (روش پیشنهادی)
- یا Python 3.13، Node.js 24 و PostgreSQL 17

## اجرای کامل با Docker

1. فایل `.env.example` را با نام `.env` کپی و مقادیر نمونه را برای محیط خود تنظیم کنید.
2. اجرا کنید: `docker compose up --build`
3. فروشگاه: `http://localhost:3000`
4. API: `http://localhost:8000/api/v1/`
5. مستندات Swagger: `http://localhost:8000/api/docs/`
6. Django Admin: `http://localhost:8000/admin/`

پس از بالا آمدن سرویس‌ها، داده‌های توسعه را با `docker compose exec backend python manage.py seed_data` بسازید و مدیر را با `docker compose exec backend python manage.py createsuperuser` ایجاد کنید.

## دیپلوی روی Render

فایل `render.yaml` هر سه بخش موردنیاز را می‌سازد: فرانت Next.js، بک‌اند Django و PostgreSQL. روی دکمه Deploy بالا کلیک کنید، ریپو را متصل کنید و هنگام ساخت Blueprint فقط مقدار محرمانه `ADMIN_PASSWORD` را تعیین کنید. پس از پایان ساخت، فروشگاه روی آدرس `janebi-store.onrender.com` و API روی سرویس `janebi-api` در دسترس است. داده‌های نمونه در اولین دیپلوی ساخته می‌شوند و انتشارهای بعدی با هر push به شاخه `main` خودکار خواهند بود.

ورود پنل مدیریت از مسیر `/login?next=/admin` با ایمیل `admin@janebi.ir` و رمزی است که در `ADMIN_PASSWORD` وارد کرده‌اید. رمز یا کلید واقعی را داخل Git commit نکنید.

## راه‌اندازی Backend بدون Docker

```text
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_data
python manage.py createsuperuser
python manage.py runserver
```

اگر `DATABASE_URL` تعیین نشود، پروژه برای توسعه و تست از SQLite استفاده می‌کند. برای PostgreSQL مقدار آن را مانند `postgresql://user:password@localhost:5432/janebi` تنظیم کنید.

## راه‌اندازی Frontend بدون Docker

```text
cd frontend
npm install
npm run dev
```

متغیر `NEXT_PUBLIC_API_URL` باید به `http://localhost:8000/api/v1` اشاره کند.

## متغیرهای محیطی

Backend از `SECRET_KEY`، `DEBUG`، `DATABASE_URL`، `ALLOWED_HOSTS`، `CORS_ALLOWED_ORIGINS`، `FRONTEND_URL`، تنظیمات عمر JWT و تنظیمات ایمیل استفاده می‌کند. Frontend فقط URL عمومی API را دریافت می‌کند. فایل `.env` commit نمی‌شود و در production باید `DEBUG=False` و secret قوی استفاده شود.

## Migration و داده آزمایشی

```text
python manage.py makemigrations
python manage.py migrate
python manage.py seed_data
```

فرمان seed idempotent است و حداقل ۵ دسته، ۷ برند، ۳۰ محصول، تنوع و موجودی، نظر، مشتری نمونه، روش ارسال و کوپن `WELCOME10` ایجاد می‌کند. رمز کاربران توسعه `TestPass123!` است و فقط برای داده‌ی محلی seed شده استفاده می‌شود.

## احراز هویت

ثبت‌نام در `/api/v1/auth/register/`، ورود با ایمیل یا موبایل در `/api/v1/auth/login/`، تعویض access token در `/api/v1/auth/refresh/` و logout با blacklist کردن refresh token در `/api/v1/auth/logout/` انجام می‌شود. access token به‌صورت پیش‌فرض ۱۵ دقیقه اعتبار دارد.

## API و مستندات

API نسخه‌بندی شده و شامل products، categories، brands، reviews، cart، wishlist، orders، payments، coupons، notifications و admin stats است. OpenAPI JSON در `/api/schema/` و Swagger UI در `/api/docs/` قرار دارد. جستجو نام، توضیحات، SKU، برند و دسته را پوشش می‌دهد و filter، sorting و pagination سمت backend انجام می‌شوند.

## سفارش و موجودی

ثبت سفارش در `transaction.atomic()` انجام می‌شود. تنوع‌ها با `select_for_update()` قفل می‌شوند، قیمت دوباره از database خوانده می‌شود و موجودی هرگز از داده‌ی frontend پذیرفته نمی‌شود. لغو سفارش مجاز موجودی را بازمی‌گرداند. آدرس، نام محصول، SKU و قیمت در سفارش snapshot می‌شوند.

## پرداخت آزمایشی

ابتدا سفارش را با `POST /api/v1/orders/checkout/` بسازید، سپس `POST /api/v1/payments/create_payment/` را با `order_id` فراخوانی کنید. پاسخ یک `payment_url` می‌دهد. روی endpoint mock می‌توان `result=success` یا `result=failed` ارسال کرد. gateway پشت service مستقل است تا provider واقعی بعداً جایگزین شود.

## تست و کنترل کیفیت

```text
cd backend
python manage.py check
pytest

cd ../frontend
npm run build
```

تست‌های backend مسیرهای ثبت‌نام و JWT، محصول و فیلتر، دسترسی غیرمجاز، ثبت سفارش، کاهش موجودی، مالکیت سفارش و پرداخت mock را پوشش می‌دهند.

## نکات Production

`DEBUG=False`، secret مستقل، HTTPS، originهای دقیق CORS، SMTP، storage سازگار با S3/Cloudinary، backup PostgreSQL و reverse proxy امن تنظیم شوند. فایل‌های media توسعه روی volume نگهداری می‌شوند. سفارش و پرداخت hard delete نمی‌شوند و محصولات با `is_active` غیرفعال می‌شوند.
