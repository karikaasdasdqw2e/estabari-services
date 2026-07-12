"use strict";

const ADMIN_USERNAME = "karika";
const ADMIN_EMAIL = "karika@estabari.local";
const CONFIG = window.APP_CONFIG || {};

const categories = [
  { id: "carpentry", name: "نجارة وأثاث", icon: "🪚" },
  { id: "plumbing", name: "سباكة وصرف", icon: "🔧" },
  { id: "electricity", name: "كهرباء وصيانة", icon: "💡" },
  { id: "painting", name: "نقاشة وديكور", icon: "🎨" },
  { id: "metal", name: "حدادة وألوميتال", icon: "⚒️" },
  { id: "construction", name: "بناء وتشطيبات", icon: "🧱" },
  { id: "appliances", name: "صيانة أجهزة منزلية", icon: "🔌" },
  { id: "phones", name: "موبايلات وكمبيوتر", icon: "📱" },
  { id: "transport", name: "نقل ومواصلات", icon: "🚚" },
  { id: "food", name: "مطاعم وأكل بيتي", icon: "🍲" },
  { id: "cafes", name: "كافيهات ومشروبات", icon: "☕" },
  { id: "doctors", name: "أطباء وعيادات", icon: "🩺" },
  { id: "pharmacies", name: "صيدليات وتحاليل", icon: "💊" },
  { id: "education", name: "مدرسون ودروس", icon: "📚" },
  { id: "events", name: "أفراح ومناسبات", icon: "🎉" },
  { id: "beauty", name: "حلاقة وتجميل", icon: "✂️" },
  { id: "clothing", name: "ملابس وخياطة", icon: "🧵" },
  { id: "agriculture", name: "زراعة ومواشي", icon: "🌾" },
  { id: "legal", name: "محاماة وخدمات حكومية", icon: "⚖️" },
  { id: "shops", name: "محلات وتجارة", icon: "🛍️" },
  { id: "cleaning", name: "نظافة ومكافحة حشرات", icon: "🧹" },
  { id: "security", name: "كاميرات وإنترنت", icon: "📹" },
  { id: "religious", name: "خدمات دينية وخيرية", icon: "🕌" },
  { id: "other", name: "خدمات أخرى", icon: "🧰" }
];

const state = {
  supabase: null,
  providers: [],
  stats: null,
  query: "",
  status: "all",
  category: "all",
  sort: "newest",
  activeSection: "overview",
  pendingConfirm: null
};

const elements = {};

function cacheElements() {
  [
    "loginView", "dashboardView", "adminLoginForm", "adminUsername", "adminPassword", "togglePassword",
    "loginButton", "loginMessage", "adminSidebar", "openSidebarButton", "closeSidebarButton", "logoutButton",
    "adminPageTitle", "adminConnection", "refreshAdminButton", "statTotal", "statApproved", "statSuspended",
    "statFeatured", "statVerified", "statVisitors", "statVisits", "recentProvidersList", "adminSearchInput",
    "adminStatusFilter", "adminCategoryFilter", "adminSortFilter", "providersTableBody", "adminEmptyState",
    "providerDialog", "providerForm", "providerDialogTitle", "providerDialogKicker", "saveProviderButton",
    "adminProviderCategory", "confirmDialog", "confirmTitle", "confirmMessage", "cancelConfirmButton",
    "confirmActionButton", "adminToastRegion", "inlineProviderFormContainer", "providerFormTemplate",
    "exportCsvButton", "exportCsvSettingsButton"
  ].forEach((id) => { elements[id] = document.getElementById(id); });
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function normalizeArabic(value = "") {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[إأآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ـ/g, "")
    .replace(/[^\u0600-\u06FFa-z0-9\s]/gi, " ")
    .replace(/\s+/g, " ");
}

function getCategory(id) {
  return categories.find((category) => category.id === id) || categories[categories.length - 1];
}

function formatDate(value) {
  if (!value) return "—";
  try {
    return new Intl.DateTimeFormat("ar-EG", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    }).format(new Date(value));
  } catch {
    return "—";
  }
}

function formatNumber(value) {
  const parsed = Number(value || 0);
  return parsed.toLocaleString("ar-EG");
}

function statusLabel(status) {
  return {
    approved: "منشورة",
    suspended: "موقوفة",
    pending: "قيد المراجعة",
    rejected: "مرفوضة"
  }[status] || status;
}

function showToast(title, message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `admin-toast${type === "error" ? " error" : ""}`;
  toast.innerHTML = `<span>${type === "error" ? "⚠" : "✓"}</span><div><strong>${escapeHtml(title)}</strong><p>${escapeHtml(message)}</p></div>`;
  elements.adminToastRegion.appendChild(toast);
  window.setTimeout(() => toast.remove(), 4600);
}

function setConnection(type, text) {
  elements.adminConnection.classList.remove("connected", "error");
  if (type) elements.adminConnection.classList.add(type);
  elements.adminConnection.innerHTML = `<i></i> ${escapeHtml(text)}`;
}

function setLoginLoading(loading) {
  const label = elements.loginButton.querySelector(".login-label");
  const spinner = elements.loginButton.querySelector(".admin-spinner");
  elements.loginButton.disabled = loading;
  label.hidden = loading;
  spinner.hidden = !loading;
}

function setSaveLoading(loading) {
  const label = elements.saveProviderButton.querySelector("span");
  const spinner = elements.saveProviderButton.querySelector("i");
  elements.saveProviderButton.disabled = loading;
  label.hidden = loading;
  spinner.hidden = !loading;
}

function initSupabase() {
  if (!CONFIG.SUPABASE_URL || !CONFIG.SUPABASE_ANON_KEY || !window.supabase?.createClient) {
    throw new Error("إعدادات Supabase غير مكتملة.");
  }

  state.supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false
    }
  });
}

function isAdminUser(user) {
  return Boolean(user?.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());
}

async function handleLogin(event) {
  event.preventDefault();
  elements.loginMessage.textContent = "";

  const username = elements.adminUsername.value.trim().toLowerCase();
  const password = elements.adminPassword.value;

  if (username !== ADMIN_USERNAME) {
    elements.loginMessage.textContent = "اسم المستخدم أو كلمة المرور غير صحيحة.";
    return;
  }

  setLoginLoading(true);

  try {
    const { data, error } = await state.supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password
    });

    if (error) throw error;
    if (!isAdminUser(data.user)) {
      await state.supabase.auth.signOut();
      throw new Error("هذا الحساب غير مصرح له بالإدارة.");
    }

    elements.adminPassword.value = "";
    await showDashboard();
  } catch (error) {
    console.error("Admin login failed:", error);
    elements.loginMessage.textContent = "تعذر تسجيل الدخول. تأكد من البيانات وإنشاء حساب الإدارة في Supabase.";
  } finally {
    setLoginLoading(false);
  }
}

async function showDashboard() {
  elements.loginView.hidden = true;
  elements.dashboardView.hidden = false;
  await loadAllData();
}

function showLogin() {
  elements.dashboardView.hidden = true;
  elements.loginView.hidden = false;
  elements.adminUsername.value = ADMIN_USERNAME;
  elements.adminPassword.focus();
}

async function checkExistingSession() {
  const { data, error } = await state.supabase.auth.getSession();
  if (error || !data.session || !isAdminUser(data.session.user)) {
    if (data?.session) await state.supabase.auth.signOut();
    showLogin();
    return;
  }

  await showDashboard();
}

async function logout() {
  await state.supabase.auth.signOut();
  state.providers = [];
  showLogin();
  showToast("تم تسجيل الخروج", "تم إنهاء جلسة الإدارة بنجاح.");
}

async function loadProviders() {
  const { data, error } = await state.supabase
    .from("providers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  state.providers = data || [];
}

async function loadStats() {
  const { data, error } = await state.supabase.rpc("admin_dashboard_stats");
  if (error) throw error;
  state.stats = data || {};
}

async function loadAllData() {
  setConnection("", "جاري الاتصال...");

  try {
    await Promise.all([loadProviders(), loadStats()]);
    setConnection("connected", "متصل بقاعدة البيانات");
    renderAll();
  } catch (error) {
    console.error("Admin data load failed:", error);
    setConnection("error", "تعذر الاتصال");
    showToast("تعذر تحميل لوحة التحكم", "شغّل تحديث ملف SQL وأنشئ حساب الإدارة أولًا.", "error");
  }
}

function renderStats() {
  const stats = state.stats || {};
  const fallback = {
    total_providers: state.providers.length,
    approved_providers: state.providers.filter((item) => item.status === "approved").length,
    suspended_providers: state.providers.filter((item) => item.status === "suspended").length,
    featured_providers: state.providers.filter((item) => item.featured).length,
    verified_providers: state.providers.filter((item) => item.verified).length,
    unique_visitors: 0,
    total_visits: 0
  };

  const merged = { ...fallback, ...stats };
  elements.statTotal.textContent = formatNumber(merged.total_providers);
  elements.statApproved.textContent = formatNumber(merged.approved_providers);
  elements.statSuspended.textContent = formatNumber(merged.suspended_providers);
  elements.statFeatured.textContent = formatNumber(merged.featured_providers);
  elements.statVerified.textContent = formatNumber(merged.verified_providers);
  elements.statVisitors.textContent = formatNumber(merged.unique_visitors);
  elements.statVisits.textContent = `إجمالي الزيارات: ${formatNumber(merged.total_visits)}`;
}

function renderRecentProviders() {
  const recent = state.providers.slice(0, 6);

  if (!recent.length) {
    elements.recentProvidersList.innerHTML = `<div class="admin-empty"><span>＋</span><h3>لا توجد خدمات بعد</h3><p>أضف أول خدمة من لوحة التحكم.</p></div>`;
    return;
  }

  elements.recentProvidersList.innerHTML = recent.map((provider) => {
    const category = getCategory(provider.category);
    return `
      <div class="admin-recent-item">
        <span class="admin-recent-avatar">${category.icon}</span>
        <div><strong>${escapeHtml(provider.name)}</strong><small>${escapeHtml(provider.service_name)} · ${formatDate(provider.created_at)}</small></div>
        <span class="admin-status-badge ${escapeHtml(provider.status)}">${escapeHtml(statusLabel(provider.status))}</span>
      </div>
    `;
  }).join("");
}

function searchableProvider(provider) {
  const category = getCategory(provider.category);
  return normalizeArabic([
    provider.name,
    provider.phone,
    provider.whatsapp,
    provider.service_name,
    provider.description,
    provider.area,
    provider.address,
    category.name
  ].filter(Boolean).join(" "));
}

function filteredProviders() {
  const query = normalizeArabic(state.query);
  let providers = state.providers.filter((provider) => {
    const matchesQuery = !query || searchableProvider(provider).includes(query);
    const matchesStatus = state.status === "all" || provider.status === state.status;
    const matchesCategory = state.category === "all" || provider.category === state.category;
    return matchesQuery && matchesStatus && matchesCategory;
  });

  providers.sort((a, b) => {
    if (state.sort === "oldest") return new Date(a.created_at) - new Date(b.created_at);
    if (state.sort === "name") return String(a.name).localeCompare(String(b.name), "ar");
    if (state.sort === "featured") return Number(Boolean(b.featured)) - Number(Boolean(a.featured)) || new Date(b.created_at) - new Date(a.created_at);
    return new Date(b.created_at) - new Date(a.created_at);
  });

  return providers;
}

function providerFlags(provider) {
  const flags = [];
  if (provider.verified) flags.push("✓ موثقة");
  if (provider.featured) flags.push("★ مميزة");
  if (provider.delivery) flags.push("🚚 منزلية");
  if (provider.emergency) flags.push("⚡ عاجلة");
  return flags.length ? flags.map((flag) => `<span>${flag}</span>`).join("") : `<span>عادية</span>`;
}

function renderProvidersTable() {
  const providers = filteredProviders();
  elements.providersTableBody.innerHTML = providers.map((provider) => {
    const category = getCategory(provider.category);
    const whatsapp = provider.whatsapp || provider.phone || "—";
    const toggleStatusText = provider.status === "approved" ? "إيقاف" : "نشر";
    const toggleStatusValue = provider.status === "approved" ? "suspended" : "approved";

    return `
      <tr data-provider-id="${escapeHtml(provider.id)}">
        <td>
          <div class="admin-provider-cell">
            <span class="admin-provider-avatar">${category.icon}</span>
            <div class="admin-provider-main"><strong title="${escapeHtml(provider.name)}">${escapeHtml(provider.name)}</strong><small>${escapeHtml(provider.service_name)}<br>${escapeHtml(provider.area || "")}</small></div>
          </div>
        </td>
        <td><div class="admin-contact-lines"><strong>${escapeHtml(category.name)}</strong><span>☎ ${escapeHtml(provider.phone)}</span><span>واتساب: ${escapeHtml(whatsapp)}</span></div></td>
        <td><span class="admin-status-badge ${escapeHtml(provider.status)}">${escapeHtml(statusLabel(provider.status))}</span></td>
        <td><div class="admin-feature-flags">${providerFlags(provider)}</div></td>
        <td>${formatDate(provider.created_at)}</td>
        <td>
          <div class="admin-row-actions">
            <button type="button" data-action="edit" data-id="${escapeHtml(provider.id)}">تعديل</button>
            <button type="button" data-action="status" data-id="${escapeHtml(provider.id)}" data-value="${toggleStatusValue}">${toggleStatusText}</button>
            <button type="button" data-action="verify" data-id="${escapeHtml(provider.id)}">${provider.verified ? "إلغاء التوثيق" : "توثيق"}</button>
            <button type="button" data-action="feature" data-id="${escapeHtml(provider.id)}">${provider.featured ? "إلغاء التمييز" : "تمييز"}</button>
            <button type="button" data-action="delete" data-id="${escapeHtml(provider.id)}">حذف</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  elements.adminEmptyState.hidden = providers.length > 0;
}

function renderAll() {
  renderStats();
  renderRecentProviders();
  renderProvidersTable();
}

function populateCategorySelects() {
  const options = categories.map((category) => `<option value="${category.id}">${category.icon} ${escapeHtml(category.name)}</option>`).join("");
  elements.adminCategoryFilter.insertAdjacentHTML("beforeend", options);
  elements.adminProviderCategory.insertAdjacentHTML("beforeend", options);

  const template = elements.providerFormTemplate.content.cloneNode(true);
  elements.inlineProviderFormContainer.appendChild(template);
  const inlineSelect = elements.inlineProviderFormContainer.querySelector("[data-inline-category]");
  if (inlineSelect) inlineSelect.insertAdjacentHTML("beforeend", options);
}

function showSection(section) {
  state.activeSection = section;
  document.querySelectorAll(".admin-panel-section").forEach((item) => {
    item.classList.toggle("active", item.dataset.section === section);
  });
  document.querySelectorAll("[data-admin-section]").forEach((button) => {
    button.classList.toggle("active", button.dataset.adminSection === section);
  });

  const titles = {
    overview: "نظرة عامة",
    providers: "إدارة الخدمات",
    add: "إضافة خدمة",
    settings: "إعدادات وأمان"
  };
  elements.adminPageTitle.textContent = titles[section] || "لوحة التحكم";
  elements.adminSidebar.classList.remove("open");
}

function providerById(id) {
  return state.providers.find((provider) => String(provider.id) === String(id));
}

function openProviderDialog(provider = null) {
  elements.providerForm.reset();
  elements.providerForm.elements.id.value = provider?.id || "";
  elements.providerDialogTitle.textContent = provider ? "تعديل الخدمة" : "إضافة خدمة جديدة";
  elements.providerDialogKicker.textContent = provider ? "تحديث البيانات" : "إضافة من الإدارة";

  if (provider) {
    const fields = [
      "name", "phone", "whatsapp", "category", "service_name", "description", "area", "address",
      "opening_hours", "social_url", "maps_url", "latitude", "longitude", "status", "rejection_reason"
    ];
    fields.forEach((field) => {
      if (elements.providerForm.elements[field]) elements.providerForm.elements[field].value = provider[field] ?? "";
    });
    ["delivery", "emergency", "verified", "featured"].forEach((field) => {
      elements.providerForm.elements[field].checked = Boolean(provider[field]);
    });
  } else {
    elements.providerForm.elements.status.value = "approved";
  }

  elements.providerDialog.showModal();
}

function closeProviderDialog() {
  elements.providerDialog.close();
}

function formToPayload(form) {
  const data = new FormData(form);
  return {
    name: String(data.get("name") || "").trim(),
    phone: String(data.get("phone") || "").trim(),
    whatsapp: String(data.get("whatsapp") || "").trim() || null,
    category: String(data.get("category") || "").trim(),
    service_name: String(data.get("service_name") || "").trim(),
    description: String(data.get("description") || "").trim() || null,
    area: String(data.get("area") || "").trim(),
    address: String(data.get("address") || "").trim() || null,
    opening_hours: String(data.get("opening_hours") || "").trim() || null,
    social_url: String(data.get("social_url") || "").trim() || null,
    maps_url: String(data.get("maps_url") || "").trim() || null,
    latitude: data.get("latitude") ? Number(data.get("latitude")) : null,
    longitude: data.get("longitude") ? Number(data.get("longitude")) : null,
    delivery: data.get("delivery") === "on",
    emergency: data.get("emergency") === "on",
    verified: data.get("verified") === "on",
    featured: data.get("featured") === "on",
    status: String(data.get("status") || "approved"),
    rejection_reason: String(data.get("rejection_reason") || "").trim() || null
  };
}

async function saveProvider(event) {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) return;

  const providerId = form.elements.id.value;
  const payload = formToPayload(form);
  setSaveLoading(true);

  try {
    let response;
    if (providerId) {
      response = await state.supabase.from("providers").update(payload).eq("id", providerId).select("*").single();
    } else {
      response = await state.supabase.from("providers").insert(payload).select("*").single();
    }

    if (response.error) throw response.error;
    closeProviderDialog();
    await loadAllData();
    showToast(providerId ? "تم تحديث الخدمة" : "تمت إضافة الخدمة", "تم حفظ البيانات في قاعدة البيانات بنجاح.");
  } catch (error) {
    console.error("Save provider failed:", error);
    showToast("فشل حفظ الخدمة", error.message || "راجع البيانات وحاول مرة أخرى.", "error");
  } finally {
    setSaveLoading(false);
  }
}

async function saveInlineProvider(event) {
  const form = event.target.closest("[data-inline-provider-form]");
  if (!form) return;
  event.preventDefault();
  if (!form.reportValidity()) return;

  const button = form.querySelector("button[type='submit']");
  const original = button.textContent;
  button.disabled = true;
  button.textContent = "جاري الحفظ...";

  try {
    const payload = { ...formToPayload(form), status: "approved" };
    const { error } = await state.supabase.from("providers").insert(payload);
    if (error) throw error;
    form.reset();
    await loadAllData();
    showToast("تمت إضافة الخدمة", "ظهرت الخدمة الآن في الموقع.");
  } catch (error) {
    console.error("Inline provider save failed:", error);
    showToast("تعذر إضافة الخدمة", error.message || "حاول مرة أخرى.", "error");
  } finally {
    button.disabled = false;
    button.textContent = original;
  }
}

function openConfirm({ title, message, confirmText = "تأكيد", onConfirm }) {
  state.pendingConfirm = onConfirm;
  elements.confirmTitle.textContent = title;
  elements.confirmMessage.textContent = message;
  elements.confirmActionButton.textContent = confirmText;
  elements.confirmDialog.showModal();
}

function closeConfirm() {
  elements.confirmDialog.close();
  state.pendingConfirm = null;
}

async function executeConfirm() {
  const action = state.pendingConfirm;
  if (!action) return;
  elements.confirmActionButton.disabled = true;
  try {
    await action();
    closeConfirm();
  } finally {
    elements.confirmActionButton.disabled = false;
  }
}

async function updateProviderFields(id, fields, successMessage) {
  const { error } = await state.supabase.from("providers").update(fields).eq("id", id);
  if (error) throw error;
  await loadAllData();
  showToast("تم تنفيذ الإجراء", successMessage);
}

async function handleRowAction(button) {
  const id = button.dataset.id;
  const provider = providerById(id);
  if (!provider) return;

  try {
    if (button.dataset.action === "edit") {
      openProviderDialog(provider);
      return;
    }

    if (button.dataset.action === "status") {
      const status = button.dataset.value;
      await updateProviderFields(id, { status }, status === "approved" ? "تم نشر الخدمة." : "تم إيقاف الخدمة وإخفاؤها من الموقع.");
      return;
    }

    if (button.dataset.action === "verify") {
      await updateProviderFields(id, { verified: !provider.verified }, provider.verified ? "تم إلغاء توثيق الخدمة." : "تم توثيق الخدمة.");
      return;
    }

    if (button.dataset.action === "feature") {
      await updateProviderFields(id, { featured: !provider.featured }, provider.featured ? "تم إلغاء تمييز الخدمة." : "تم تمييز الخدمة وإظهارها أولًا.");
      return;
    }

    if (button.dataset.action === "delete") {
      openConfirm({
        title: "حذف الخدمة نهائيًا؟",
        message: `سيتم حذف «${provider.name}» من قاعدة البيانات ولن تظهر للزوار مرة أخرى.`,
        confirmText: "حذف نهائي",
        onConfirm: async () => {
          const { error } = await state.supabase.from("providers").delete().eq("id", id);
          if (error) throw error;
          await loadAllData();
          showToast("تم حذف الخدمة", "تمت إزالة الخدمة من قاعدة البيانات.");
        }
      });
    }
  } catch (error) {
    console.error("Provider action failed:", error);
    showToast("تعذر تنفيذ الإجراء", error.message || "حاول مرة أخرى.", "error");
  }
}

function exportCsv() {
  if (!state.providers.length) {
    showToast("لا توجد بيانات", "لا توجد خدمات لتصديرها حاليًا.", "error");
    return;
  }

  const headers = [
    "الاسم", "الموبايل", "واتساب", "القسم", "اسم الخدمة", "الوصف", "المنطقة", "العنوان",
    "المواعيد", "الحالة", "موثقة", "مميزة", "خدمة منزلية", "عاجلة", "تاريخ الإضافة"
  ];

  const rows = state.providers.map((provider) => [
    provider.name,
    provider.phone,
    provider.whatsapp || "",
    getCategory(provider.category).name,
    provider.service_name,
    provider.description || "",
    provider.area,
    provider.address || "",
    provider.opening_hours || "",
    statusLabel(provider.status),
    provider.verified ? "نعم" : "لا",
    provider.featured ? "نعم" : "لا",
    provider.delivery ? "نعم" : "لا",
    provider.emergency ? "نعم" : "لا",
    provider.created_at || ""
  ]);

  const escapeCsv = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const csv = "\uFEFF" + [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `estabari-services-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  showToast("تم تصدير البيانات", "تم تحميل ملف CSV بجميع الخدمات.");
}

function registerEvents() {
  elements.adminLoginForm.addEventListener("submit", handleLogin);
  elements.togglePassword.addEventListener("click", () => {
    const visible = elements.adminPassword.type === "text";
    elements.adminPassword.type = visible ? "password" : "text";
    elements.togglePassword.setAttribute("aria-label", visible ? "إظهار كلمة المرور" : "إخفاء كلمة المرور");
  });

  elements.logoutButton.addEventListener("click", logout);
  elements.openSidebarButton.addEventListener("click", () => elements.adminSidebar.classList.add("open"));
  elements.closeSidebarButton.addEventListener("click", () => elements.adminSidebar.classList.remove("open"));
  elements.refreshAdminButton.addEventListener("click", loadAllData);

  document.addEventListener("click", (event) => {
    const sectionButton = event.target.closest("[data-admin-section]");
    if (sectionButton) {
      showSection(sectionButton.dataset.adminSection);
      if (sectionButton.dataset.statusShortcut) {
        state.status = sectionButton.dataset.statusShortcut;
        elements.adminStatusFilter.value = state.status;
        renderProvidersTable();
      }
    }

    const openFormButton = event.target.closest("[data-open-provider-form]");
    if (openFormButton) openProviderDialog();

    const closeFormButton = event.target.closest("[data-close-provider-dialog]");
    if (closeFormButton) closeProviderDialog();

    const rowAction = event.target.closest("[data-action]");
    if (rowAction) handleRowAction(rowAction);
  });

  elements.adminSearchInput.addEventListener("input", () => {
    state.query = elements.adminSearchInput.value;
    renderProvidersTable();
  });
  elements.adminStatusFilter.addEventListener("change", () => {
    state.status = elements.adminStatusFilter.value;
    renderProvidersTable();
  });
  elements.adminCategoryFilter.addEventListener("change", () => {
    state.category = elements.adminCategoryFilter.value;
    renderProvidersTable();
  });
  elements.adminSortFilter.addEventListener("change", () => {
    state.sort = elements.adminSortFilter.value;
    renderProvidersTable();
  });

  elements.providersTableBody.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    if (button) handleRowAction(button);
  });

  elements.providerForm.addEventListener("submit", saveProvider);
  elements.inlineProviderFormContainer.addEventListener("submit", saveInlineProvider);
  elements.cancelConfirmButton.addEventListener("click", closeConfirm);
  elements.confirmActionButton.addEventListener("click", executeConfirm);
  elements.exportCsvButton.addEventListener("click", exportCsv);
  elements.exportCsvSettingsButton.addEventListener("click", exportCsv);

  elements.providerDialog.addEventListener("click", (event) => {
    if (event.target === elements.providerDialog) closeProviderDialog();
  });
  elements.confirmDialog.addEventListener("click", (event) => {
    if (event.target === elements.confirmDialog) closeConfirm();
  });
}

async function initialize() {
  cacheElements();
  populateCategorySelects();
  registerEvents();
  elements.adminUsername.value = ADMIN_USERNAME;

  try {
    initSupabase();
    await checkExistingSession();
  } catch (error) {
    console.error("Admin initialization failed:", error);
    elements.loginMessage.textContent = "تعذر تشغيل لوحة التحكم لأن إعدادات قاعدة البيانات غير مكتملة.";
    showLogin();
  }
}

document.addEventListener("DOMContentLoaded", initialize);
