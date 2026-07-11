window.APP_CONFIG = {
  // بيانات مشروع Supabase العامة المستخدمة داخل الواجهة.
  SUPABASE_URL: "https://cbwahudauwtpllabiqla.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_PvA9-yINBscGfnS_t127Jw_-wZo2ZTg",

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
 * 2) التحقق من حفظ الخدمة داخل Supabase بقراءة السجل مرة ثانية بعد الإضافة.
 * 3) إخفاء النماذج التجريبية بمجرد وجود خدمات حقيقية.
 * 4) تبويب مستقل للخدمات التي أضافها أهل البلد.
 * 5) عداد زوار فريد وحقيقي من Supabase، بدون جمع اسم أو رقم أو عنوان IP.
 */
document.addEventListener("DOMContentLoaded", () => {
  if (typeof state === "undefined" || typeof elements === "undefined") return;

  const autoApprove = window.APP_CONFIG.AUTO_APPROVE !== false;
  let realVisitorCount = null;
  let addedServicesOnly = false;

  function injectEnhancementStyles() {
    if (document.getElementById("estabariEnhancementStyles")) return;

    const style = document.createElement("style");
    style.id = "estabariEnhancementStyles";
    style.textContent = `
      .providers-tabs {
        display: flex;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
        gap: 12px;
        margin: 18px 0 14px;
        padding: 7px;
        border: 1px solid #d6e6df;
        border-radius: 16px;
        background: #f7fbf9;
      }

      .providers-tabs-group {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 6px;
      }

      .providers-tab,
      .providers-refresh {
        min-height: 42px;
        padding: 9px 16px;
        border: 0;
        border-radius: 11px;
        color: #34554a;
        font-family: inherit;
        font-weight: 800;
        cursor: pointer;
      }

      .providers-tab {
        background: transparent;
      }

      .providers-tab.active {
        background: #0f6848;
        color: #fff;
        box-shadow: 0 6px 16px rgba(15, 104, 72, 0.18);
      }

      .providers-tab-count {
        display: inline-grid;
        place-items: center;
        min-width: 25px;
        height: 25px;
        margin-inline-start: 5px;
        padding: 0 6px;
        border-radius: 999px;
        background: rgba(15, 104, 72, 0.1);
        font-size: 11px;
      }

      .providers-tab.active .providers-tab-count {
        background: rgba(255, 255, 255, 0.18);
      }

      .providers-refresh {
        border: 1px solid #cfe2d9;
        background: #fff;
        color: #0f6848;
      }

      .providers-refresh:disabled {
        cursor: wait;
        opacity: 0.65;
      }

      .storage-status {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        margin: 0 0 16px;
        padding: 7px 11px;
        border-radius: 999px;
        background: #f4f7f5;
        color: #5f716b;
        font-size: 12px;
        font-weight: 800;
      }

      .storage-status.connected {
        background: #eaf8f1;
        color: #0f6848;
      }

      .storage-status.error {
        background: #fff2f0;
        color: #a2392f;
      }

      .storage-status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: currentColor;
      }

      @media (max-width: 640px) {
        .providers-tabs {
          align-items: stretch;
        }

        .providers-tabs-group,
        .providers-tab,
        .providers-refresh {
          width: 100%;
        }

        .providers-tabs-group {
          display: grid;
          grid-template-columns: 1fr 1fr;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function getRealProviders() {
    return state.providers.filter((provider) =>
      !provider.isDemo && provider.status === "approved"
    );
  }

  function addProviderTabs() {
    const toolbar = document.querySelector("#providersSection .results-toolbar");
    if (!toolbar || document.getElementById("providersTabs")) return;

    toolbar.insertAdjacentHTML(
      "beforebegin",
      `
        <div class="providers-tabs" id="providersTabs" aria-label="تبويبات الخدمات">
          <div class="providers-tabs-group" role="tablist">
            <button class="providers-tab active" id="allServicesTab" type="button" role="tab" aria-selected="true">
              كل الخدمات
            </button>
            <button class="providers-tab" id="addedServicesTab" type="button" role="tab" aria-selected="false">
              الخدمات المضافة
              <span class="providers-tab-count" id="addedServicesCount">٠</span>
            </button>
          </div>
          <button class="providers-refresh" id="refreshProvidersButton" type="button">↻ تحديث القائمة</button>
        </div>
        <div class="storage-status" id="storageStatus" aria-live="polite">
          <span class="storage-status-dot"></span>
          <span>جاري فحص حفظ الخدمات...</span>
        </div>
      `
    );

    document.getElementById("allServicesTab")?.addEventListener("click", () => {
      addedServicesOnly = false;
      state.sort = "recommended";
      if (elements.sortFilter) elements.sortFilter.value = "recommended";
      renderAll();
      updateProviderTabs();
    });

    document.getElementById("addedServicesTab")?.addEventListener("click", () => {
      addedServicesOnly = true;
      state.onlyFavorites = false;
      state.sort = "newest";
      if (elements.sortFilter) elements.sortFilter.value = "newest";
      renderAll();
      updateProviderTabs();
      document.getElementById("providersSection")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    document.getElementById("refreshProvidersButton")?.addEventListener("click", async (event) => {
      const button = event.currentTarget;
      button.disabled = true;
      const originalText = button.textContent;
      button.textContent = "جاري التحديث...";
      await loadProviders();
      await checkStorageConnection();
      button.disabled = false;
      button.textContent = originalText;
      showToast("تم تحديث الخدمات", "تم تحميل أحدث الخدمات المحفوظة في قاعدة البيانات.");
    });
  }

  function updateProviderTabs() {
    const allTab = document.getElementById("allServicesTab");
    const addedTab = document.getElementById("addedServicesTab");
    const addedCount = document.getElementById("addedServicesCount");
    const realCount = getRealProviders().length;

    if (addedCount) addedCount.textContent = realCount.toLocaleString("ar-EG");

    if (allTab) {
      allTab.classList.toggle("active", !addedServicesOnly);
      allTab.setAttribute("aria-selected", String(!addedServicesOnly));
    }

    if (addedTab) {
      addedTab.classList.toggle("active", addedServicesOnly);
      addedTab.setAttribute("aria-selected", String(addedServicesOnly));
    }
  }

  function setStorageStatus(type, text) {
    const status = document.getElementById("storageStatus");
    if (!status) return;

    status.classList.remove("connected", "error");
    if (type) status.classList.add(type);

    const label = status.querySelector("span:last-child");
    if (label) label.textContent = text;
  }

  async function checkStorageConnection() {
    if (!state.databaseEnabled || !state.supabase) {
      setStorageStatus("error", "الحفظ غير متصل بقاعدة البيانات");
      return false;
    }

    try {
      const { error } = await state.supabase
        .from("providers")
        .select("id", { count: "exact", head: true })
        .eq("status", "approved");

      if (error) throw error;

      setStorageStatus("connected", "الحفظ متصل بقاعدة البيانات ✓");
      return true;
    } catch (error) {
      console.error("Storage connection check failed:", error);
      setStorageStatus("error", "تعذر الاتصال بقاعدة البيانات");
      return false;
    }
  }

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

  injectEnhancementStyles();
  addProviderTabs();

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

    const baseGetFilteredProviders = getFilteredProviders;
    getFilteredProviders = function getFilteredPublishedProviders() {
      let result = baseGetFilteredProviders();

      if (addedServicesOnly) {
        result = result
          .filter((provider) => !provider.isDemo && provider.status === "approved")
          .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      }

      return result;
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
      updateProviderTabs();
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

      if (addedServicesOnly) {
        elements.providersTitle.textContent = "الخدمات المضافة للموقع";
        elements.providersSubtitle.textContent = realResults.length
          ? `تم عرض ${realResults.length.toLocaleString("ar-EG")} خدمة أضافها أهل البلد، مرتبة من الأحدث.`
          : "لم تُضف خدمات حقيقية حتى الآن.";
      } else if (!result.length) {
        elements.providersSubtitle.textContent = "لا توجد نتائج مطابقة حاليًا.";
      } else if (realResults.length) {
        elements.providersSubtitle.textContent = `تم العثور على ${realResults.length.toLocaleString("ar-EG")} مقدم خدمة حقيقي ويمكن التواصل معه مباشرةً.`;
      } else if (demoResults.length) {
        elements.providersSubtitle.textContent = "دي نماذج توضيحية مؤقتة، وأول ما أهل البلد يسجلوا خدماتهم هتختفي تلقائيًا.";
      }

      updateProviderTabs();
    };

    updateCounts = function updatePublishedCounts() {
      const realProviders = getRealProviders().length;
      elements.servicesCount.textContent = `+${categories.length}`;
      elements.providersCount.textContent = realProviders.toLocaleString("ar-EG");
      renderVisitorCount();
      updateProviderTabs();
    };

    submitService = async function submitAndPublishService(event) {
      event.preventDefault();
      const form = elements.serviceRegistrationForm;
      if (!form.reportValidity()) return;

      let provider = formDataToProvider(new FormData(form));
      setSubmitLoading(true);

      try {
        if (state.databaseEnabled) {
          const { data: insertedRow, error: insertError } = await state.supabase
            .from("providers")
            .insert(providerToDatabasePayload(provider))
            .select("*")
            .single();

          if (insertError) throw insertError;
          if (!insertedRow?.id) throw new Error("لم ترجع قاعدة البيانات معرّف الخدمة الجديدة.");

          // تحقق إضافي: اقرأ نفس السجل مرة ثانية من قاعدة البيانات قبل إظهار رسالة النجاح.
          const { data: confirmedRow, error: confirmError } = await state.supabase
            .from("providers")
            .select("*")
            .eq("id", insertedRow.id)
            .single();

          if (confirmError) throw confirmError;
          if (!confirmedRow?.id) throw new Error("تعذر تأكيد حفظ الخدمة.");

          provider = mapDatabaseProvider(confirmedRow);
          setStorageStatus("connected", "تم تأكيد حفظ آخر خدمة في قاعدة البيانات ✓");
        } else {
          const existing = getLocalSubmissions().map((item) => ({ ...item, status: "approved" }));
          existing.unshift(provider);
          saveLocalSubmissions(existing.slice(0, 50));
          setStorageStatus("error", "تم الحفظ على هذا الجهاز فقط؛ قاعدة البيانات غير متصلة");
        }

        state.providers = [
          provider,
          ...state.providers.filter((item) => !item.isDemo && String(item.id) !== String(provider.id))
        ];

        addedServicesOnly = true;
        state.sort = "newest";
        if (elements.sortFilter) elements.sortFilter.value = "newest";

        form.reset();
        elements.descriptionCounter.textContent = "0";
        elements.locationStatus.textContent = "لم يتم تحديد الموقع";
        closeRegistrationDialog();
        renderAll();
        updateProviderTabs();
        document.getElementById("providersSection")?.scrollIntoView({ behavior: "smooth", block: "start" });

        showToast(
          "تم حفظ ونشر خدمتك بنجاح",
          state.databaseEnabled
            ? "تمت قراءة الخدمة مرة ثانية من قاعدة البيانات للتأكد من حفظها، وهي ظاهرة الآن داخل تبويب الخدمات المضافة."
            : "ظهرت الخدمة على جهازك فقط. راجع اتصال Supabase لتظهر لجميع الزوار."
        );
      } catch (error) {
        console.error("Registration failed:", error);
        setStorageStatus("error", "فشل حفظ آخر خدمة في قاعدة البيانات");
        showToast("لم يتم حفظ الخدمة", "لم تؤكد قاعدة البيانات الحفظ. راجع الاتصال ثم حاول مرة أخرى.", "error");
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
    if (submitLabel) submitLabel.textContent = "حفظ ونشر الخدمة";

    const ctaParagraph = document.querySelector(".register-cta .cta-card p");
    if (ctaParagraph) ctaParagraph.textContent = "التسجيل مجاني، وخدمتك هتظهر فورًا عشان أهل البلد يقدروا يتواصلوا معاك.";

    if (typeof infoContent !== "undefined") {
      infoContent.privacy.body = "<p>يعرض الموقع البيانات التي يرسلها مقدم الخدمة مثل الاسم ورقم التواصل والعنوان ومواعيد العمل فور التسجيل. لا نطلب كلمات مرور أو بيانات مالية.</p><p>عداد الزوار يعتمد على رمز عشوائي محفوظ في المتصفح لحساب المتصفحات الفريدة، ولا يجمع الاسم أو رقم الهاتف أو الموقع الجغرافي.</p>";
    }
  }

  // تعمل بعد تهيئة قاعدة البيانات داخل initialize في app.js.
  window.setTimeout(async () => {
    await checkStorageConnection();
    await trackRealVisitor();
    updateProviderTabs();
  }, 0);
});
