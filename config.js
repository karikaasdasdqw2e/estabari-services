window.APP_CONFIG = {
  // ضع بيانات مشروع Supabase هنا بعد إنشائه.
  SUPABASE_URL: "",
  SUPABASE_ANON_KEY: "",

  // اختياري: رقم واتساب إدارة الموقع بصيغة دولية بدون +، مثال: 201XXXXXXXXX
  ADMIN_WHATSAPP: "",

  // اسم القرية المستخدم داخل رسائل واتساب والواجهة.
  VILLAGE_NAME: "إصطباري",

  // مؤقتًا: نشر الخدمات فور تسجيلها. يمكن تغييره إلى false عند تفعيل المراجعة لاحقًا.
  AUTO_APPROVE: true
};

/*
 * تحسينات الإطلاق الأول:
 * 1) نشر مقدم الخدمة فورًا.
 * 2) إخفاء النماذج التجريبية بمجرد وجود خدمات حقيقية.
 * 3) عداد زوار فريد وحقيقي من Supabase، بدون جمع اسم أو رقم أو عنوان IP.
 *
 * هذا الملف يُحمّل قبل app.js، ولذلك نسجّل المستمع الآن ليعمل قبل تهيئة التطبيق
 * عند اكتمال تحميل الصفحة.
 */
document.addEventListener("DOMContentLoaded", () => {
  if (typeof state === "undefined" || typeof elements === "undefined") return;

  const autoApprove = window.APP_CONFIG.AUTO_APPROVE !== false;
  let realVisitorCount = null;

  function addVisitorCounter() {
    const trustRow = document.querySelector(".hero-trust");
    if (!trustRow || document.getElementById("visitorsCount")) return;

    trustRow.style.flexWrap = "wrap";
    trustRow.insertAdjacentHTML(
      "beforeend",
      '<div class="visitor-stat" title="يُحسب كل متصفح مرة واحدة"><strong id="visitorsCount">—</strong><span>زائر للموقع</span></div>'
    );
  }

  function makeVisitorId() {
    const storageKey = "estabari_visitor_id";
    let visitorId = localStorage.getItem(storageKey);
    if (visitorId) return visitorId;

    if (window.crypto?.randomUUID) {
      visitorId = window.crypto.randomUUID();
    } else {
      visitorId = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
        const random = Math.random() * 16 | 0;
        const value = character === "x" ? random : (random & 0x3 | 0x8);
        return value.toString(16);
      });
    }

    localStorage.setItem(storageKey, visitorId);
    return visitorId;
  }

  function renderVisitorCount() {
    const counter = document.getElementById("visitorsCount");
    if (!counter) return;
    counter.textContent = Number.isFinite(realVisitorCount)
      ? realVisitorCount.toLocaleString("ar-EG")
      : "—";
  }

  async function trackRealVisitor() {
    addVisitorCounter();
    renderVisitorCount();

    if (!state.databaseEnabled || !state.supabase) {
      const counter = document.getElementById("visitorsCount");
      if (counter) counter.title = "يبدأ العد الحقيقي بعد ربط Supabase";
      return;
    }

    try {
      const { data, error } = await state.supabase.rpc("track_site_visit", {
        p_visitor_id: makeVisitorId()
      });
      if (error) throw error;

      const parsedCount = Number(Array.isArray(data) ? data[0] : data);
      if (Number.isFinite(parsedCount)) realVisitorCount = parsedCount;
      renderVisitorCount();
    } catch (error) {
      console.warn("Visitor counter unavailable:", error);
    }
  }

  if (autoApprove) {
    const originalFormDataToProvider = formDataToProvider;
    formDataToProvider = function formDataToPublishedProvider(formData) {
      const provider = originalFormDataToProvider(formData);
      provider.status = "approved";
      return provider;
    };

    const originalProviderToDatabasePayload = providerToDatabasePayload;
    providerToDatabasePayload = function publishedProviderPayload(provider) {
      return {
        ...originalProviderToDatabasePayload(provider),
        status: "approved"
      };
    };

    loadProviders = async function loadPublishedProviders() {
      const localProviders = getLocalSubmissions().map((provider) => ({
        ...provider,
        status: "approved"
      }));
      let databaseProviders = [];

      if (state.databaseEnabled) {
        try {
          const { data, error } = await state.supabase
            .from("providers")
            .select("*")
            .eq("status", "approved")
            .order("featured", { ascending: false })
            .order("created_at", { ascending: false });
          if (error) throw error;
          databaseProviders = (data || []).map(mapDatabaseProvider);
        } catch (error) {
          console.error("Could not load providers:", error);
          showToast("تعذر الاتصال بقاعدة البيانات", "يتم عرض النسخة المحلية مؤقتًا.", "error");
        }
      }

      const realProviders = [...databaseProviders, ...localProviders];
      state.providers = realProviders.length ? realProviders : [...demoProviders];
      renderAll();
    };

    categoryProviderCount = function countPublishedProviders(categoryId) {
      return state.providers.filter((provider) =>
        provider.category === categoryId && !provider.isDemo && provider.status === "approved"
      ).length;
    };

    const originalRenderProviders = renderProviders;
    renderProviders = function renderPublishedProviders() {
      originalRenderProviders();
      const result = getFilteredProviders();
      const realResults = result.filter((provider) => !provider.isDemo);
      const demoResults = result.filter((provider) => provider.isDemo);

      if (!result.length) {
        elements.providersSubtitle.textContent = "لا توجد نتائج مطابقة حاليًا.";
      } else if (realResults.length) {
        elements.providersSubtitle.textContent = `تم العثور على ${realResults.length.toLocaleString("ar-EG")} مقدم خدمة حقيقي ويمكن التواصل معه مباشرةً.`;
      } else if (demoResults.length) {
        elements.providersSubtitle.textContent = "دي نماذج توضيحية مؤقتة، وأول ما أهل البلد يسجلوا خدماتهم هتختفي تلقائيًا.";
      }
    };

    updateCounts = function updatePublishedCounts() {
      const realProviders = state.providers.filter((provider) =>
        !provider.isDemo && provider.status === "approved"
      ).length;
      elements.servicesCount.textContent = `+${categories.length}`;
      elements.providersCount.textContent = realProviders.toLocaleString("ar-EG");
      renderVisitorCount();
    };

    submitService = async function submitAndPublishService(event) {
      event.preventDefault();
      const form = elements.serviceRegistrationForm;
      if (!form.reportValidity()) return;

      let provider = formDataToProvider(new FormData(form));
      setSubmitLoading(true);

      try {
        if (state.databaseEnabled) {
          const { data, error } = await state.supabase
            .from("providers")
            .insert(providerToDatabasePayload(provider))
            .select("*")
            .single();
          if (error) throw error;
          provider = mapDatabaseProvider(data);
        } else {
          const existing = getLocalSubmissions().map((item) => ({ ...item, status: "approved" }));
          existing.unshift(provider);
          saveLocalSubmissions(existing.slice(0, 50));
        }

        state.providers = [
          provider,
          ...state.providers.filter((item) => !item.isDemo && String(item.id) !== String(provider.id))
        ];

        form.reset();
        elements.descriptionCounter.textContent = "0";
        elements.locationStatus.textContent = "لم يتم تحديد الموقع";
        closeRegistrationDialog();
        renderAll();
        document.getElementById("providersSection")?.scrollIntoView({ behavior: "smooth", block: "start" });

        showToast(
          "تم نشر خدمتك بنجاح",
          state.databaseEnabled
            ? "ظهرت خدمتك الآن لكل زوار الموقع ويمكنهم الاتصال أو التواصل عبر واتساب."
            : "ظهرت الخدمة على جهازك فقط. اربط Supabase لتظهر لجميع الزوار."
        );
      } catch (error) {
        console.error("Registration failed:", error);
        showToast("لم يتم إرسال البيانات", "راجع الاتصال وإعدادات قاعدة البيانات ثم حاول مرة أخرى.", "error");
      } finally {
        setSubmitLoading(false);
      }
    };

    const privacyNote = document.querySelector(".privacy-note");
    if (privacyNote) privacyNote.innerHTML = "<span aria-hidden=\"true\">✓</span> خدمتك بتظهر فور التسجيل ويمكن الإبلاغ عن أي بيانات خاطئة";

    const registrationIntro = document.querySelector("#registrationTitle + p");
    if (registrationIntro) registrationIntro.textContent = "اكتب بيانات صحيحة وواضحة، وهتظهر خدمتك فورًا في دليل البلد.";

    const consentText = document.querySelector(".consent span");
    if (consentText) consentText.innerHTML = "أؤكد أن البيانات صحيحة، وأوافق على عرضها فورًا للزوار. <b>*</b>";

    const submitLabel = document.querySelector("#submitServiceButton .button-label");
    if (submitLabel) submitLabel.textContent = "نشر الخدمة الآن";

    const ctaParagraph = document.querySelector(".register-cta .cta-card p");
    if (ctaParagraph) ctaParagraph.textContent = "التسجيل مجاني، وخدمتك هتظهر فورًا عشان أهل البلد يقدروا يتواصلوا معاك.";

    if (typeof infoContent !== "undefined") {
      infoContent.privacy.body = "<p>يعرض الموقع البيانات التي يرسلها مقدم الخدمة مثل الاسم ورقم التواصل والعنوان ومواعيد العمل فور التسجيل. لا نطلب كلمات مرور أو بيانات مالية.</p><p>عداد الزوار يعتمد على رمز عشوائي محفوظ في المتصفح لحساب المتصفحات الفريدة، ولا يجمع الاسم أو رقم الهاتف أو الموقع الجغرافي.</p>";
    }
  }

  // يعمل بعد تهيئة قاعدة البيانات داخل initialize في app.js.
  window.setTimeout(trackRealVisitor, 0);
});
