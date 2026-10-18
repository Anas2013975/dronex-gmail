# Dronex Gmail — المرحلة الأولى (Vertical Slice)

منصة إدارة مجتمع ديسكورد (تذاكر ومهام ومكافآت). هذه المرحلة تحتوي فقط على:
`/help` + `/link` + `/key` + تسجيل الدخول للوحة التحكم. بقية الميزات ستُضاف في المراحل التالية.

## المتطلبات
- حساب Discord + حساب [Supabase](https://supabase.com) (قاعدة PostgreSQL مجانية) + حساب [Vercel](https://vercel.com) + حساب Wispbyte.
- تثبيت [Node.js 22](https://nodejs.org) و Git على جهازك.

## 1) إنشاء تطبيق ديسكورد
1. افتح <https://discord.com/developers/applications> ← **New Application**.
2. من **General Information** انسخ **Application ID** (هذا هو `DISCORD_CLIENT_ID`).
3. من تبويب **Bot** اضغط **Reset Token** وانسخ التوكن (هذا `DISCORD_TOKEN`). **لا تشاركه مع أحد ولا تضعه في GitHub.**
4. هذه المرحلة تحتاج فقط intent الأساسي (Guilds)، ولا تحتاج تفعيل Privileged Intents.
5. من **OAuth2 → URL Generator** اختر `bot` و `applications.commands`، ثم افتح الرابط وأضف البوت لسيرفرك.

## 2) إنشاء قاعدة البيانات
1. في Supabase: **New project**.
2. افتح **Project Settings → Database → Connection string** وانسخ الرابط (هذا `DATABASE_URL`). استبدل `[YOUR-PASSWORD]` بكلمة مرور المشروع.

## 3) التشغيل المحلي
```bash
git clone <رابط-مشروعك> dronex-gmail && cd dronex-gmail
npm install
cp .env.example .env        # ثم املأ القيم داخل .env
```
ولّد سرّاً قوياً لـ `AUTH_CODE_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```
حمّل المتغيرات وطبّق الجداول وسجّل الأوامر:
```bash
set -a; source .env; set +a      # Linux / macOS (Git Bash على ويندوز)
npm run db:migrate          # ينشئ الجداول
npm run bot:register        # يسجل أوامر السلاش
npm run bot:start           # يشغل البوت
```
في نافذة ثانية (مع نفس المتغيرات):
```bash
npm run web:dev             # اللوحة على http://localhost:3000
```
> محلياً اجعل `DASHBOARD_URL=http://localhost:3000`.

## 4) التحقق
1. في ديسكورد اكتب `/help` ← تظهر رسالة خاصة (ephemeral) فيها قائمة أقسام؛ اختر "التسجيل..." وسترى `/key` و `/link` (تظهر فقط لمن لديه صلاحية Manage Server).
2. اكتب `/link` ثم افتح الرابط.
3. اكتب `/key` وانسخ الكود (16 خانة، صالح 5 دقائق، مرة واحدة) وألصقه في صفحة الدخول.
4. تظهر لوحة التحكم مع معرّف المستخدم والسيرفر. جرّب إعادة استخدام نفس الكود: يجب أن يُرفض.
5. فحص البوت: `http://localhost:3001/health` (يعمل) و `/ready` (ديسكورد + قاعدة البيانات).

## 5) النشر على Vercel (اللوحة)
1. ارفع المشروع إلى GitHub (الملف `.env` مُتجاهَل تلقائياً).
2. في Vercel: **Add New → Project** واختر المستودع، ثم في **Root Directory** اختر `apps/web`.
3. في **Environment Variables** أضف: `DATABASE_URL` (استخدم رابط الـ pooler من Supabase) و `AUTH_CODE_SECRET` و `DASHBOARD_URL` (رابط موقعك على Vercel بعد أول نشر، ثم أعد النشر).
4. اضغط **Deploy**. إذا فشل البناء لأن `@dronex/shared` غير موجود، فعّل خيار "Include source files outside of the Root Directory" في إعدادات المشروع.

## 6) النشر على Wispbyte (البوت)
> لم أتحقق من واجهة Wispbyte الحالية، لذلك راجع توثيقهم الرسمي لخطوات رفع الملفات واختيار ملف التشغيل. المطلوب منك:
- Node.js إصدار 22 أو أحدث.
- أمر التثبيت من جذر المشروع: `npm install` (المشروع Monorepo، يجب تثبيته من الجذر).
- أمر التشغيل: `npm run bot:start`.
- أضف المتغيرات في لوحة الاستضافة (وليس في الملفات): `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `DATABASE_URL`, `AUTH_CODE_SECRET` (نفس قيمة Vercel بالضبط), `DASHBOARD_URL`, واختيارياً `OWNER_DISCORD_IDS`, `PORT`.
- نفّذ `npm run db:migrate` و `npm run bot:register` مرة واحدة من جهازك (مع نفس `DATABASE_URL`) قبل التشغيل.

## 7) المتغيرات المطلوبة
| المتغير | أين | الوصف |
|---|---|---|
| `DATABASE_URL` | البوت + اللوحة | رابط PostgreSQL |
| `AUTH_CODE_SECRET` | البوت + اللوحة (متطابق) | سرّ التشفير (32 حرفاً فأكثر) |
| `DASHBOARD_URL` | البوت + اللوحة | رابط اللوحة العام |
| `DISCORD_TOKEN` | البوت فقط | توكن البوت |
| `DISCORD_CLIENT_ID` | البوت فقط | Application ID |
| `DISCORD_GUILD_ID` | اختياري | سيرفر تجريبي لتسجيل فوري للأوامر |
| `OWNER_DISCORD_IDS` | اختياري | معرّفات مسموح لها دائماً (مفصولة بفواصل) |
| `PORT` | اختياري | منفذ فحص الصحة (3001) |

## 8) مشاكل شائعة
- **`Invalid environment`**: متغير ناقص أو خاطئ؛ الرسالة تذكر اسم الحقل فقط.
- **الأوامر لا تظهر**: شغّل `npm run bot:register`؛ الأوامر العامة قد تتأخر، استخدم `DISCORD_GUILD_ID` للاختبار.
- **"الكود غير صحيح"**: الكود انتهى أو استُخدم، أو `AUTH_CODE_SECRET` مختلف بين البوت واللوحة.
- **"محاولات كثيرة"**: حدّ الحماية من التخمين؛ انتظر 15 دقيقة.

## 9) تدوير الأسرار المسرّبة
- التوكن: Developer Portal → Bot → Reset Token ثم حدّث `DISCORD_TOKEN` في الاستضافة.
- `AUTH_CODE_SECRET`: ولّد قيمة جديدة وضعها في الموقعين (تُنهي كل الجلسات والأكواد الحالية).
- كلمة مرور قاعدة البيانات: غيّرها من Supabase ثم حدّث `DATABASE_URL`.

## الأوامر المفيدة
`npm run typecheck` • `npm run lint` • `npm test` • `npm run build`
