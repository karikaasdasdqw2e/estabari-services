window.APP_CONFIG = {
  // ضع بيانات مشروع Supabase هنا بعد إنشائه.
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: "",

  // اختياري: رقم واتساب إدارة الموقع بصيغة دولية بدون +، مثال: 201XXXXXXXXX
  ADMIN_WHATSAPP: "",

  // اسم القرية المستخدم داخل رسائل واتساب والواجهة.
  VILLAGE_NAME: "إصطباري"
};

/*
 * عند استخدام Supabase لا نطلب إعادة صف التسجيل الجديد؛ لأن سياسة الخصوصية
 * تسمح للزائر برؤية الخدمات المعتمدة فقط. هذا التعديل يضمن نجاح الإرسال
 * مع بقاء الطلب قيد المراجعة وغير مكشوف لباقي الزوار.
 */
document.addEventListener("DOMContentLoaded", () => {
  if (typeof submitService !== "function") return;

  submitService = async function submitServiceSafely(event) {
    event.preventDefault();
    const form = elements.serviceRegistrationForm;
    if (!form.reportValidity()) return;

    const provider = formDataToProvider(new FormData(form));
    setSubmitLoading(true);

    try {
      if (state.databaseEnabled) {
        const { error } = await state.supabase
          .from("providers")
          .insert(providerToDatabasePayload(provider));
        if (error) throw error;
      } else {
        const existing = getLocalSubmissions();
        existing.unshift(provider);
        saveLocalSubmissions(existing.slice(0, 50));
      }

      state.providers.unshift(provider);
      form.reset();
      elements.descriptionCounter.textContent = "0";
      elements.locationStatus.textContent = "لم يتم تحديد الموقع";
      closeRegistrationDialog();
      renderAll();
      showToast(
        "تم إرسال الخدمة بنجاح",
        state.databaseEnabled
          ? "بياناتك قيد المراجعة وستظهر للجميع بعد اعتمادها."
          : "تم حفظها على هذا الجهاز للتجربة. اربط Supabase لتصل البيانات لكل الزوار."
      );
    } catch (error) {
      console.error("Registration failed:", error);
      showToast("لم يتم إرسال البيانات", "راجع الاتصال والإعدادات ثم حاول مرة أخرى.", "error");
    } finally {
      setSubmitLoading(false);
    }
  };
});
