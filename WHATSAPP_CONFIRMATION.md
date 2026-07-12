# رسالة واتساب تلقائية بعد تسجيل الخدمة

الميزة ممكنة، لكن الإرسال التلقائي الحقيقي لا يتم من JavaScript داخل GitHub Pages، لأن توكن WhatsApp Business سيتكشف لأي زائر. لذلك تم تجهيز Supabase Edge Function آمنة في:

```text
supabase/functions/send-whatsapp-confirmation/index.ts
```

## ما تحتاجه

1. حساب Meta Business.
2. تطبيق WhatsApp Business Cloud API.
3. رقم واتساب بيزنس مضاف للتطبيق.
4. قالب رسالة معتمد باسم مثل:

```text
service_added_confirmation
```

مثال نص القالب:

```text
أهلًا {{1}}، تم إضافة خدمة {{2}} بنجاح إلى مجمع خدمات إصطباري، وأصبحت ظاهرة للزوار.
```

## أسرار Edge Function

أضف القيم التالية من Supabase Dashboard داخل Edge Function Secrets، ولا تضعها داخل GitHub:

```text
WHATSAPP_ACCESS_TOKEN
WHATSAPP_PHONE_NUMBER_ID
WHATSAPP_TEMPLATE_NAME=service_added_confirmation
WHATSAPP_TEMPLATE_LANGUAGE=ar
WHATSAPP_GRAPH_VERSION=<إصدار Graph API المستخدم في حساب Meta>
WHATSAPP_WEBHOOK_SECRET=<قيمة عشوائية قوية>
```

## النشر

يمكن نشر الدالة من Supabase Dashboard أو Supabase CLI باسم:

```text
send-whatsapp-confirmation
```

## تشغيلها تلقائيًا بعد تسجيل الخدمة

من Supabase:

1. افتح Database Webhooks.
2. أنشئ Webhook جديدًا على جدول `public.providers`.
3. اختر حدث `INSERT`.
4. اجعل الرابط هو رابط Edge Function الخاصة بـ `send-whatsapp-confirmation`.
5. أضف Header:

```text
x-webhook-secret: نفس قيمة WHATSAPP_WEBHOOK_SECRET
```

عند تسجيل خدمة منشورة، الدالة تقرأ الاسم ورقم واتساب واسم الخدمة من قاعدة البيانات، ثم ترسل القالب المعتمد إلى مقدم الخدمة.

## ملاحظات

- إذا ترك الشخص رقم واتساب فارغًا، تستخدم الدالة رقم الهاتف الأساسي.
- يجب أن يكون الرقم مصريًا صحيحًا.
- القالب يجب أن يكون معتمدًا من Meta قبل الإرسال للإشعارات الجديدة.
- لا تضع Access Token أو Secret Key داخل `config.js` أو ملفات الواجهة.
