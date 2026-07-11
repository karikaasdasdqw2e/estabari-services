"use strict";

const CONFIG = window.APP_CONFIG || {};

const categories = [
  { id: "carpentry", name: "نجارة وأثاث", icon: "🪚", keywords: "نجار موبيليا باب شباك اثاث مطبخ" },
  { id: "plumbing", name: "سباكة وصرف", icon: "🔧", keywords: "سباك مياه صرف صحي خلاط تسريب" },
  { id: "electricity", name: "كهرباء وصيانة", icon: "💡", keywords: "كهربائي كهرباء أعطال تأسيس أجهزة" },
  { id: "painting", name: "نقاشة وديكور", icon: "🎨", keywords: "نقاش دهان تشطيب ديكور جبس" },
  { id: "metal", name: "حدادة وألوميتال", icon: "⚒️", keywords: "حداد الوميتال شبابيك ابواب حديد" },
  { id: "construction", name: "بناء وتشطيبات", icon: "🧱", keywords: "بناء محارة سيراميك رخام مقاول" },
  { id: "appliances", name: "صيانة أجهزة منزلية", icon: "🔌", keywords: "غسالة ثلاجة تكييف بوتاجاز سخان صيانة" },
  { id: "phones", name: "موبايلات وكمبيوتر", icon: "📱", keywords: "موبايل كمبيوتر لاب صيانة اكسسوارات" },
  { id: "transport", name: "نقل ومواصلات", icon: "🚚", keywords: "نقل عفش سيارة توكتوك توصيل مواصلات" },
  { id: "food", name: "مطاعم وأكل بيتي", icon: "🍲", keywords: "مطعم اكل بيتي وجبات مشويات حلويات مخبوزات" },
  { id: "cafes", name: "كافيهات ومشروبات", icon: "☕", keywords: "كافيه قهوة عصير مشروبات" },
  { id: "doctors", name: "أطباء وعيادات", icon: "🩺", keywords: "دكتور طبيب عيادة أسنان أطفال باطنة جلدية" },
  { id: "pharmacies", name: "صيدليات وتحاليل", icon: "💊", keywords: "صيدلية دواء تحاليل معمل أشعة" },
  { id: "education", name: "مدرسون ودروس", icon: "📚", keywords: "مدرس دروس خصوصية تعليم حضانة تحفيظ" },
  { id: "events", name: "أفراح ومناسبات", icon: "🎉", keywords: "افراح دي جي تصوير فراشة كوشة حفلات" },
  { id: "beauty", name: "حلاقة وتجميل", icon: "✂️", keywords: "حلاق كوافير تجميل عناية" },
  { id: "clothing", name: "ملابس وخياطة", icon: "🧵", keywords: "خياط ملابس تفصيل ستائر مفروشات" },
  { id: "agriculture", name: "زراعة ومواشي", icon: "🌾", keywords: "زراعة فلاح مواشي بيطري اعلاف مبيدات" },
  { id: "legal", name: "محاماة وخدمات حكومية", icon: "⚖️", keywords: "محامي أوراق حكومية ضرائب تأمينات" },
  { id: "shops", name: "محلات وتجارة", icon: "🛍️", keywords: "محل بقالة سوبر ماركت ادوات منزلية تجارة" },
  { id: "cleaning", name: "نظافة ومكافحة حشرات", icon: "🧹", keywords: "نظافة تنظيف حشرات رش تعقيم" },
  { id: "security", name: "كاميرات وإنترنت", icon: "📹", keywords: "كاميرات مراقبة انترنت راوتر شبكات دش" },
  { id: "religious", name: "خدمات دينية وخيرية", icon: "🕌", keywords: "تحفيظ قرآن صدقات جمعيات خيرية" },
  { id: "other", name: "خدمات أخرى", icon: "🧰", keywords: "خدمة خدمات اخرى متنوع" }
];

const demoProviders = [
  {
    id: "demo-carpenter",
    name: "مثال: ورشة نجارة محلية",
    serviceName: "نجارة أثاث وأبواب",
    category: "carpentry",
    description: "هذا نموذج توضيحي لشكل بيانات مقدم الخدمة. سيتم استبداله ببيانات أهل البلد بعد التسجيل والمراجعة.",
    area: "إصطباري",
    address: "العنوان يظهر هنا",
    openingHours: "مواعيد العمل تظهر هنا",
    verified: false,
    isDemo: true,
    createdAt: "2026-07-01T10:00:00Z"
  },
  {
    id: "demo-plumber",
    name: "مثال: سباك من أهل البلد",
    serviceName: "سباكة وصيانة منزلية",
    category: "plumbing",
    description: "إصلاح تسريبات المياه وتركيب الأدوات الصحية. بطاقة تجريبية لعرض تصميم الموقع فقط.",
    area: "إصطباري",
    address: "العنوان يظهر هنا",
    openingHours: "متاح حسب الاتفاق",
    emergency: true,
    isDemo: true,
    createdAt: "2026-07-02T10:00:00Z"
  },
  {
    id: "demo-doctor",
    name: "مثال: عيادة طبية",
    serviceName: "كشف ومتابعة طبية",
    category: "doctors",
    description: "سيظهر هنا تخصص الطبيب ومواعيد العيادة ومعلومات التواصل بعد اعتماد البيانات.",
    area: "إصطباري",
    address: "عنوان العيادة يظهر هنا",
    openingHours: "المواعيد تظهر هنا",
    isDemo: true,
    createdAt: "2026-07-03T10:00:00Z"
  },
  {
    id: "demo-food",
    name: "مثال: مطبخ وأكل بيتي",
    serviceName: "وجبات وأكل بيتي",
    category: "food",
    description: "مكان مخصص لوصف أنواع الوجبات وخدمة التوصيل ومواعيد استقبال الطلبات.",
    area: "إصطباري",
    address: "المكان يظهر هنا",
    openingHours: "يوميًا",
    delivery: true,
    isDemo: true,
    createdAt: "2026-07-04T10:00:00Z"
  },
  {
    id: "demo-electrician",
    name: "مثال: فني كهرباء",
    serviceName: "كهرباء منازل وصيانة",
    category: "electricity",
    description: "تأسيس وإصلاح أعطال الكهرباء. هذه بيانات تجريبية وليست إعلانًا حقيقيًا.",
    area: "إصطباري",
    address: "العنوان يظهر هنا",
    openingHours: "متاح حسب الاتفاق",
    emergency: true,
    isDemo: true,
    createdAt: "2026-07-05T10:00:00Z"
  },
  {
    id: "demo-events",
    name: "مثال: تجهيز حفلات",
    serviceName: "تنظيم أفراح ومناسبات",
    category: "events",
    description: "سيظهر هنا وصف خدمات الأفراح والتصوير والدي جي والتجهيزات المتاحة.",
    area: "إصطباري",
    address: "يخدم داخل وخارج القرية",
    openingHours: "بالحجز المسبق",
    delivery: true,
    isDemo: true,
    createdAt: "2026-07-06T10:00:00Z"
  }
];

const state = {
  providers: [],
  query: "",
  selectedCategory: "all",
  sort: "recommended",
  showAllCategories: false,
  view: localStorage.getItem("estabari_view") || "grid",
  favorites: new Set(JSON.parse(localStorage.getItem("estabari_favorites") || "[]")),
  onlyFavorites: false,
  userLocation: null,
  supabase: null,
  databaseEnabled: false
};

const elements = {};

function cacheElements() {
  const ids = [
    "categoriesGrid", "showAllCategories", "providersGrid", "emptyState", "providersTitle",
    "providersSubtitle", "heroSearchForm", "heroSearchInput", "providerSearchInput", "categoryFilter",
    "sortFilter", "useMyLocationButton", "activeFilter", "activeFilterText", "clearFiltersButton",
    "gridViewButton", "listViewButton", "servicesCount", "providersCount", "registrationDialog",
    "serviceRegistrationForm", "registrationCategory", "captureLocationButton", "locationStatus",
    "descriptionCounter", "submitServiceButton", "infoDialog", "infoDialogTitle", "infoDialogContent",
    "toastRegion", "currentYear", "favoritesButton"
  ];
  ids.forEach((id) => { elements[id] = document.getElementById(id); });
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

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function safeExternalUrl(url = "") {
  try {
    const parsed = new URL(url);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : "";
  } catch {
    return "";
  }
}

function getCategory(id) {
  return categories.find((category) => category.id === id) || categories[categories.length - 1];
}

function toInternationalPhone(phone = "") {
  let digits = String(phone).replace(/\D/g, "");
  if (digits.startsWith("0020")) digits = digits.slice(2);
  if (digits.startsWith("20")) return digits;
  if (digits.startsWith("0")) return `20${digits.slice(1)}`;
  return digits;
}

function formatPhone(phone = "") {
  const digits = String(phone).replace(/\D/g, "");
  if (digits.length === 11) return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  return phone;
}

function createId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getLocalSubmissions() {
  try {
    return JSON.parse(localStorage.getItem("estabari_pending_services") || "[]");
  } catch {
    return [];
  }
}

function saveLocalSubmissions(items) {
  localStorage.setItem("estabari_pending_services", JSON.stringify(items));
}

function saveFavorites() {
  localStorage.setItem("estabari_favorites", JSON.stringify([...state.favorites]));
}

function mapDatabaseProvider(item) {
  return {
    id: item.id,
    name: item.name,
    phone: item.phone,
    whatsapp: item.whatsapp,
    category: item.category,
    serviceName: item.service_name,
    description: item.description,
    area: item.area,
    address: item.address,
    openingHours: item.opening_hours,
    mapsUrl: item.maps_url,
    latitude: item.latitude == null ? null : Number(item.latitude),
    longitude: item.longitude == null ? null : Number(item.longitude),
    socialUrl: item.social_url,
    delivery: Boolean(item.delivery),
    emergency: Boolean(item.emergency),
    featured: Boolean(item.featured),
    verified: Boolean(item.verified),
    status: item.status,
    createdAt: item.created_at
  };
}

function initDatabase() {
  const hasConfig = Boolean(CONFIG.SUPABASE_URL && CONFIG.SUPABASE_ANON_KEY);
  const hasLibrary = Boolean(window.supabase?.createClient);
  if (!hasConfig || !hasLibrary) return;

  try {
    state.supabase = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY, {
      auth: { persistSession: false }
    });
    state.databaseEnabled = true;
  } catch (error) {
    console.error("Supabase initialization failed:", error);
  }
}

async function loadProviders() {
  const localSubmissions = getLocalSubmissions();
  let approvedProviders = [];

  if (state.databaseEnabled) {
    try {
      const { data, error } = await state.supabase
        .from("providers")
        .select("*")
        .eq("status", "approved")
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      approvedProviders = (data || []).map(mapDatabaseProvider);
    } catch (error) {
      console.error("Could not load providers:", error);
      showToast("تعذر الاتصال بقاعدة البيانات", "يتم عرض النسخة المحلية مؤقتًا.", "error");
    }
  }

  state.providers = [...approvedProviders, ...localSubmissions, ...demoProviders];
  renderAll();
}

function populateSelects() {
  const options = categories.map((category) => `<option value="${category.id}">${escapeHtml(category.name)}</option>`).join("");
  elements.categoryFilter.insertAdjacentHTML("beforeend", options);
  elements.registrationCategory.insertAdjacentHTML("beforeend", options);
}

function categoryProviderCount(categoryId) {
  return state.providers.filter((provider) => provider.category === categoryId && !provider.isDemo && provider.status !== "pending").length;
}

function renderCategories() {
  const visibleCategories = state.showAllCategories ? categories : categories.slice(0, 12);
  elements.categoriesGrid.innerHTML = visibleCategories.map((category) => {
    const count = categoryProviderCount(category.id);
    const isActive = state.selectedCategory === category.id;
    return `
      <button class="category-card${isActive ? " active" : ""}" type="button" data-category="${category.id}" aria-pressed="${isActive}">
        <span class="category-icon" aria-hidden="true">${category.icon}</span>
        <strong>${escapeHtml(category.name)}</strong>
        <small>${count ? `${count} مقدم خدمة` : "بانتظار أول تسجيل"}</small>
      </button>
    `;
  }).join("");

  elements.showAllCategories.textContent = state.showAllCategories ? "عرض الأقسام الأساسية" : `عرض كل الأقسام (${categories.length})`;
}

function searchableText(provider) {
  const category = getCategory(provider.category);
  return normalizeArabic([
    provider.name,
    provider.serviceName,
    provider.description,
    provider.area,
    provider.address,
    category.name,
    category.keywords
  ].filter(Boolean).join(" "));
}

function distanceInKm(lat1, lon1, lat2, lon2) {
  const toRadians = (degree) => degree * Math.PI / 180;
  const earthRadius = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2;
  return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function providerDistance(provider) {
  if (!state.userLocation || provider.latitude == null || provider.longitude == null) return Number.POSITIVE_INFINITY;
  return distanceInKm(state.userLocation.latitude, state.userLocation.longitude, provider.latitude, provider.longitude);
}

function getFilteredProviders() {
  const normalizedQuery = normalizeArabic(state.query);
  let result = state.providers.filter((provider) => {
    const matchesQuery = !normalizedQuery || searchableText(provider).includes(normalizedQuery);
    const matchesCategory = state.selectedCategory === "all" || provider.category === state.selectedCategory;
    const matchesFavorites = !state.onlyFavorites || state.favorites.has(String(provider.id));
    return matchesQuery && matchesCategory && matchesFavorites;
  });

  result.sort((a, b) => {
    if (state.sort === "name") return String(a.name).localeCompare(String(b.name), "ar");
    if (state.sort === "newest") return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    if (state.sort === "nearby") return providerDistance(a) - providerDistance(b);
    return Number(Boolean(b.featured)) - Number(Boolean(a.featured))
      || Number(Boolean(b.verified)) - Number(Boolean(a.verified))
      || Number(Boolean(a.isDemo)) - Number(Boolean(b.isDemo))
      || new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
  });

  return result;
}

function getMapUrl(provider) {
  const directUrl = safeExternalUrl(provider.mapsUrl);
  if (directUrl) return directUrl;
  if (provider.latitude != null && provider.longitude != null) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${provider.latitude},${provider.longitude}`)}`;
  }
  const locationText = [provider.address, provider.area, CONFIG.VILLAGE_NAME || "إصطباري"].filter(Boolean).join("، ");
  return locationText ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationText)}` : "";
}

function providerCard(provider) {
  const category = getCategory(provider.category);
  const isFavorite = state.favorites.has(String(provider.id));
  const phone = provider.phone || "";
  const whatsapp = provider.whatsapp || phone;
  const mapUrl = getMapUrl(provider);
  const distance = providerDistance(provider);
  const hasDistance = Number.isFinite(distance);
  const safeSocialUrl = safeExternalUrl(provider.socialUrl);
  const whatsappMessage = encodeURIComponent(`السلام عليكم، وصلت لك من موقع مجمع خدمات ${CONFIG.VILLAGE_NAME || "إصطباري"} وعايز أستفسر عن خدمة ${provider.serviceName || category.name}.`);
  const internationalWhatsapp = toInternationalPhone(whatsapp);
  const pending = provider.status === "pending";

  const badges = [
    provider.verified ? `<span class="badge verified">✓ بيانات موثقة</span>` : "",
    pending ? `<span class="badge pending">⏳ قيد المراجعة</span>` : "",
    provider.isDemo ? `<span class="badge demo">نموذج تجريبي</span>` : "",
    provider.delivery ? `<span class="badge">🚚 خدمة منزلية</span>` : "",
    provider.emergency ? `<span class="badge">⚡ حالات عاجلة</span>` : "",
    hasDistance ? `<span class="badge">📍 ${distance < 1 ? `${Math.round(distance * 1000)} متر` : `${distance.toFixed(1)} كم`}</span>` : ""
  ].join("");

  const contactDisabled = provider.isDemo || !phone;
  const callAction = contactDisabled
    ? `<button class="provider-action call" type="button" disabled title="بيانات تجريبية">☎ اتصال</button>`
    : `<a class="provider-action call" href="tel:${escapeHtml(phone)}" data-contact="call" data-provider-id="${escapeHtml(provider.id)}">☎ اتصال</a>`;
  const whatsappAction = provider.isDemo || !internationalWhatsapp
    ? `<button class="provider-action whatsapp" type="button" disabled title="بيانات تجريبية">◉ واتساب</button>`
    : `<a class="provider-action whatsapp" href="https://wa.me/${internationalWhatsapp}?text=${whatsappMessage}" target="_blank" rel="noopener" data-contact="whatsapp" data-provider-id="${escapeHtml(provider.id)}">◉ واتساب</a>`;
  const mapAction = mapUrl
    ? `<a class="provider-action" href="${escapeHtml(mapUrl)}" target="_blank" rel="noopener" title="فتح الاتجاهات" aria-label="فتح الاتجاهات">⌖</a>`
    : `<button class="provider-action" type="button" disabled aria-label="لا يوجد موقع">⌖</button>`;

  return `
    <article class="provider-card" data-provider-id="${escapeHtml(provider.id)}">
      <div class="provider-card-top">
        <div class="provider-avatar" aria-hidden="true">${category.icon}</div>
        <div class="provider-heading">
          <h3 title="${escapeHtml(provider.name)}">${escapeHtml(provider.name)}</h3>
          <span class="provider-category">${escapeHtml(provider.serviceName || category.name)}</span>
        </div>
        <button class="favorite-button${isFavorite ? " active" : ""}" type="button" data-favorite="${escapeHtml(provider.id)}" aria-label="${isFavorite ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}" aria-pressed="${isFavorite}">${isFavorite ? "♥" : "♡"}</button>
      </div>
      <div class="provider-body">
        <p class="provider-description">${escapeHtml(provider.description || "لم يُضف مقدم الخدمة وصفًا بعد.")}</p>
        <div class="provider-meta">
          <span>📍 ${escapeHtml([provider.area, provider.address].filter(Boolean).join(" — ") || CONFIG.VILLAGE_NAME || "إصطباري")}</span>
          ${provider.openingHours ? `<span>🕘 ${escapeHtml(provider.openingHours)}</span>` : ""}
          ${!provider.isDemo && phone ? `<span>☎ ${escapeHtml(formatPhone(phone))}</span>` : ""}
          ${safeSocialUrl ? `<span>🔗 <a href="${escapeHtml(safeSocialUrl)}" target="_blank" rel="noopener">صفحة النشاط</a></span>` : ""}
        </div>
        <div class="provider-badges">${badges}</div>
      </div>
      <div class="provider-actions">${callAction}${whatsappAction}${mapAction}</div>
    </article>
  `;
}

function renderProviders() {
  const result = getFilteredProviders();
  elements.providersGrid.classList.toggle("list-view", state.view === "list");
  elements.providersGrid.innerHTML = result.map(providerCard).join("");
  elements.emptyState.hidden = result.length > 0;

  let title = "مقدمو الخدمات";
  if (state.onlyFavorites) title = "خدماتك المفضلة";
  else if (state.selectedCategory !== "all") title = getCategory(state.selectedCategory).name;
  else if (state.query) title = `نتائج البحث عن «${state.query}»`;

  elements.providersTitle.textContent = title;
  elements.providersSubtitle.textContent = result.length
    ? `تم العثور على ${result.length} نتيجة، ومنها نماذج تجريبية حتى تبدأ الخدمات الحقيقية في التسجيل.`
    : "لا توجد نتائج مطابقة حاليًا.";

  const filters = [];
  if (state.query) filters.push(`البحث: ${state.query}`);
  if (state.selectedCategory !== "all") filters.push(`القسم: ${getCategory(state.selectedCategory).name}`);
  if (state.onlyFavorites) filters.push("المفضلة فقط");
  elements.activeFilter.hidden = filters.length === 0;
  elements.activeFilterText.textContent = filters.join(" — ");

  elements.gridViewButton.classList.toggle("active", state.view === "grid");
  elements.listViewButton.classList.toggle("active", state.view === "list");
}

function updateCounts() {
  const realApproved = state.providers.filter((provider) => !provider.isDemo && provider.status !== "pending").length;
  elements.servicesCount.textContent = `+${categories.length}`;
  elements.providersCount.textContent = realApproved.toLocaleString("ar-EG");
}

function renderAll() {
  renderCategories();
  renderProviders();
  updateCounts();
}

function setSearch(query, scroll = true) {
  state.query = String(query || "").trim();
  elements.heroSearchInput.value = state.query;
  elements.providerSearchInput.value = state.query;
  state.onlyFavorites = false;
  renderAll();
  if (scroll) document.getElementById("providersSection")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function setCategory(categoryId, scroll = true) {
  state.selectedCategory = categoryId;
  state.onlyFavorites = false;
  elements.categoryFilter.value = categoryId;
  renderAll();
  if (scroll) document.getElementById("providersSection")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function resetFilters() {
  state.query = "";
  state.selectedCategory = "all";
  state.onlyFavorites = false;
  state.sort = "recommended";
  elements.heroSearchInput.value = "";
  elements.providerSearchInput.value = "";
  elements.categoryFilter.value = "all";
  elements.sortFilter.value = "recommended";
  renderAll();
}

function setView(view) {
  state.view = view;
  localStorage.setItem("estabari_view", view);
  renderProviders();
}

function toggleFavorite(providerId) {
  const key = String(providerId);
  if (state.favorites.has(key)) {
    state.favorites.delete(key);
    showToast("تمت الإزالة من المفضلة", "يمكنك إضافتها مرة أخرى في أي وقت.");
  } else {
    state.favorites.add(key);
    showToast("تمت الإضافة للمفضلة", "ستجدها من زر المفضلة أسفل الشاشة.");
  }
  saveFavorites();
  renderProviders();
}

function requestLocation({ forRegistration = false } = {}) {
  if (!navigator.geolocation) {
    showToast("الموقع غير مدعوم", "متصفحك لا يدعم تحديد الموقع.", "error");
    return;
  }

  const button = forRegistration ? elements.captureLocationButton : elements.useMyLocationButton;
  const originalText = button.innerHTML;
  button.disabled = true;
  button.textContent = "جاري تحديد الموقع...";

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const location = {
        latitude: Number(position.coords.latitude.toFixed(7)),
        longitude: Number(position.coords.longitude.toFixed(7))
      };

      if (forRegistration) {
        elements.serviceRegistrationForm.elements.latitude.value = location.latitude;
        elements.serviceRegistrationForm.elements.longitude.value = location.longitude;
        elements.locationStatus.textContent = "تم تحديد الموقع بنجاح ✓";
        showToast("تم حفظ الموقع", "سيُستخدم لمساعدة الأهالي في الوصول للمكان.");
      } else {
        state.userLocation = location;
        state.sort = "nearby";
        elements.sortFilter.value = "nearby";
        renderProviders();
        showToast("تم تحديد موقعك", "تم ترتيب الخدمات التي لديها موقع من الأقرب للأبعد.");
      }

      button.disabled = false;
      button.innerHTML = originalText;
    },
    (error) => {
      const messages = {
        1: "لم يتم السماح باستخدام الموقع. يمكنك السماح به من إعدادات المتصفح.",
        2: "تعذر معرفة الموقع الحالي.",
        3: "استغرق تحديد الموقع وقتًا أطول من اللازم."
      };
      showToast("تعذر تحديد الموقع", messages[error.code] || "حدث خطأ غير متوقع.", "error");
      button.disabled = false;
      button.innerHTML = originalText;
    },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 }
  );
}

function openRegistrationDialog() {
  if (typeof elements.registrationDialog.showModal === "function") {
    elements.registrationDialog.showModal();
    document.body.classList.add("dialog-open");
  } else {
    showToast("المتصفح قديم", "استخدم إصدارًا حديثًا من Chrome أو Edge.", "error");
  }
}

function closeRegistrationDialog() {
  elements.registrationDialog.close();
  document.body.classList.remove("dialog-open");
}

function setSubmitLoading(loading) {
  elements.submitServiceButton.disabled = loading;
  elements.submitServiceButton.querySelector(".button-label").hidden = loading;
  elements.submitServiceButton.querySelector(".button-loader").hidden = !loading;
}

function formDataToProvider(formData) {
  const phone = String(formData.get("phone") || "").trim();
  const whatsapp = String(formData.get("whatsapp") || "").trim() || phone;
  return {
    id: createId(),
    name: String(formData.get("name") || "").trim(),
    phone,
    whatsapp,
    category: String(formData.get("category") || "").trim(),
    serviceName: String(formData.get("serviceName") || "").trim(),
    description: String(formData.get("description") || "").trim(),
    area: String(formData.get("area") || "").trim(),
    address: String(formData.get("address") || "").trim(),
    openingHours: String(formData.get("openingHours") || "").trim(),
    socialUrl: String(formData.get("socialUrl") || "").trim(),
    mapsUrl: String(formData.get("mapsUrl") || "").trim(),
    latitude: formData.get("latitude") ? Number(formData.get("latitude")) : null,
    longitude: formData.get("longitude") ? Number(formData.get("longitude")) : null,
    delivery: formData.get("delivery") === "on",
    emergency: formData.get("emergency") === "on",
    status: "pending",
    verified: false,
    featured: false,
    createdAt: new Date().toISOString()
  };
}

function providerToDatabasePayload(provider) {
  return {
    name: provider.name,
    phone: provider.phone,
    whatsapp: provider.whatsapp,
    category: provider.category,
    service_name: provider.serviceName,
    description: provider.description || null,
    area: provider.area,
    address: provider.address || null,
    opening_hours: provider.openingHours || null,
    social_url: provider.socialUrl || null,
    maps_url: provider.mapsUrl || null,
    latitude: provider.latitude,
    longitude: provider.longitude,
    delivery: provider.delivery,
    emergency: provider.emergency,
    status: "pending"
  };
}

async function submitService(event) {
  event.preventDefault();
  const form = elements.serviceRegistrationForm;

  if (!form.reportValidity()) return;

  const provider = formDataToProvider(new FormData(form));
  setSubmitLoading(true);

  try {
    if (state.databaseEnabled) {
      const { data, error } = await state.supabase
        .from("providers")
        .insert(providerToDatabasePayload(provider))
        .select("*")
        .single();
      if (error) throw error;
      provider.id = data.id;
      provider.createdAt = data.created_at;
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
    showToast("تم إرسال الخدمة بنجاح", state.databaseEnabled
      ? "بياناتك قيد المراجعة وستظهر للجميع بعد اعتمادها."
      : "تم حفظها على هذا الجهاز للتجربة. اربط Supabase لتصل البيانات لكل الزوار.");
  } catch (error) {
    console.error("Registration failed:", error);
    showToast("لم يتم إرسال البيانات", "راجع الاتصال والإعدادات ثم حاول مرة أخرى.", "error");
  } finally {
    setSubmitLoading(false);
  }
}

function showToast(title, message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span aria-hidden="true">${type === "error" ? "⚠️" : "✓"}</span><div><strong>${escapeHtml(title)}</strong><p>${escapeHtml(message)}</p></div>`;
  elements.toastRegion.appendChild(toast);
  window.setTimeout(() => toast.remove(), 4700);
}

const infoContent = {
  privacy: {
    title: "سياسة الخصوصية",
    body: `<p>يعرض الموقع البيانات التي يرسلها مقدم الخدمة مثل الاسم التجاري ورقم التواصل والعنوان ومواعيد العمل بعد مراجعتها. لا نطلب كلمات مرور أو بيانات مالية.</p><p>موقع GPS اختياري ويُستخدم فقط لإظهار الاتجاهات وترتيب النتائج حسب القرب. يجب على مقدم الخدمة عدم إرسال بيانات شخصية لا يريد عرضها علنًا.</p>`
  },
  terms: {
    title: "شروط الاستخدام",
    body: `<p>الموقع دليل مجتمعي للتعريف بالخدمات وليس طرفًا في الاتفاق بين العميل ومقدم الخدمة. على المستخدم التأكد من السعر وجودة الخدمة قبل الاتفاق.</p><p>يحق للإدارة رفض أو حذف البيانات الخاطئة أو المكررة أو المخالفة، كما يُمنع تسجيل خدمة باسم شخص آخر دون إذنه.</p>`
  },
  report: {
    title: "الإبلاغ عن بيانات خاطئة",
    body: `<form class="info-form" data-feedback-form="report"><input name="subject" required placeholder="اسم الخدمة أو مقدمها"><textarea name="message" required rows="4" placeholder="اكتب البيانات الخاطئة أو سبب البلاغ"></textarea><button class="button button-primary" type="submit">إرسال البلاغ</button></form>`
  },
  suggestion: {
    title: "إرسال اقتراح",
    body: `<form class="info-form" data-feedback-form="suggestion"><input name="subject" required placeholder="عنوان الاقتراح"><textarea name="message" required rows="4" placeholder="اكتب اقتراحك لتطوير مجمع الخدمات"></textarea><button class="button button-primary" type="submit">إرسال الاقتراح</button></form>`
  }
};

function openInfoDialog(type) {
  const content = infoContent[type];
  if (!content) return;
  elements.infoDialogTitle.textContent = content.title;
  elements.infoDialogContent.innerHTML = content.body;
  elements.infoDialog.showModal();
  document.body.classList.add("dialog-open");
}

function closeInfoDialog() {
  elements.infoDialog.close();
  document.body.classList.remove("dialog-open");
}

function submitFeedback(event) {
  const form = event.target.closest("[data-feedback-form]");
  if (!form) return;
  event.preventDefault();
  if (!form.reportValidity()) return;

  const data = new FormData(form);
  const type = form.dataset.feedbackForm === "report" ? "بلاغ" : "اقتراح";
  const subject = String(data.get("subject") || "").trim();
  const message = String(data.get("message") || "").trim();
  const adminWhatsapp = toInternationalPhone(CONFIG.ADMIN_WHATSAPP || "");

  if (adminWhatsapp) {
    const text = encodeURIComponent(`${type} من موقع مجمع خدمات ${CONFIG.VILLAGE_NAME || "إصطباري"}\n\nالعنوان: ${subject}\nالتفاصيل: ${message}`);
    window.open(`https://wa.me/${adminWhatsapp}?text=${text}`, "_blank", "noopener");
  } else {
    const feedback = JSON.parse(localStorage.getItem("estabari_feedback") || "[]");
    feedback.unshift({ type, subject, message, createdAt: new Date().toISOString() });
    localStorage.setItem("estabari_feedback", JSON.stringify(feedback.slice(0, 30)));
    showToast(`تم حفظ ال${type}`, "أضف رقم واتساب الإدارة في config.js لإرساله مباشرةً.");
  }
  form.reset();
  closeInfoDialog();
}

function registerEvents() {
  elements.heroSearchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    setSearch(elements.heroSearchInput.value);
  });

  let searchTimer;
  elements.providerSearchInput.addEventListener("input", () => {
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => setSearch(elements.providerSearchInput.value, false), 180);
  });

  document.addEventListener("click", (event) => {
    const openRegister = event.target.closest("[data-open-register]");
    if (openRegister) openRegistrationDialog();

    const closeDialog = event.target.closest("[data-close-dialog]");
    if (closeDialog) closeRegistrationDialog();

    const quickSearch = event.target.closest("[data-quick-search]");
    if (quickSearch) setSearch(quickSearch.dataset.quickSearch);

    const focusSearch = event.target.closest("[data-focus-search]");
    if (focusSearch) {
      document.getElementById("searchSection")?.scrollIntoView({ behavior: "smooth" });
      window.setTimeout(() => elements.heroSearchInput.focus(), 450);
    }

    const categoryButton = event.target.closest("[data-category]");
    if (categoryButton) setCategory(categoryButton.dataset.category);

    const favoriteButton = event.target.closest("[data-favorite]");
    if (favoriteButton) toggleFavorite(favoriteButton.dataset.favorite);

    const infoButton = event.target.closest("[data-open-info]");
    if (infoButton) openInfoDialog(infoButton.dataset.openInfo);

    const closeInfo = event.target.closest("[data-close-info]");
    if (closeInfo) closeInfoDialog();
  });

  elements.categoriesGrid.addEventListener("click", () => {});
  elements.showAllCategories.addEventListener("click", () => {
    state.showAllCategories = !state.showAllCategories;
    renderCategories();
  });

  elements.categoryFilter.addEventListener("change", () => setCategory(elements.categoryFilter.value, false));
  elements.sortFilter.addEventListener("change", () => {
    state.sort = elements.sortFilter.value;
    if (state.sort === "nearby" && !state.userLocation) requestLocation();
    else renderProviders();
  });

  elements.useMyLocationButton.addEventListener("click", () => requestLocation());
  elements.captureLocationButton.addEventListener("click", () => requestLocation({ forRegistration: true }));
  elements.clearFiltersButton.addEventListener("click", resetFilters);
  elements.gridViewButton.addEventListener("click", () => setView("grid"));
  elements.listViewButton.addEventListener("click", () => setView("list"));

  elements.favoritesButton.addEventListener("click", () => {
    state.onlyFavorites = true;
    state.query = "";
    state.selectedCategory = "all";
    elements.heroSearchInput.value = "";
    elements.providerSearchInput.value = "";
    elements.categoryFilter.value = "all";
    renderAll();
    document.getElementById("providersSection")?.scrollIntoView({ behavior: "smooth" });
  });

  elements.serviceRegistrationForm.addEventListener("submit", submitService);
  elements.serviceRegistrationForm.elements.description.addEventListener("input", (event) => {
    elements.descriptionCounter.textContent = event.target.value.length;
  });

  elements.infoDialogContent.addEventListener("submit", submitFeedback);

  elements.registrationDialog.addEventListener("close", () => document.body.classList.remove("dialog-open"));
  elements.infoDialog.addEventListener("close", () => document.body.classList.remove("dialog-open"));

  elements.registrationDialog.addEventListener("click", (event) => {
    if (event.target === elements.registrationDialog) closeRegistrationDialog();
  });
  elements.infoDialog.addEventListener("click", (event) => {
    if (event.target === elements.infoDialog) closeInfoDialog();
  });

  window.addEventListener("offline", () => showToast("أنت غير متصل بالإنترنت", "البحث في البيانات المحفوظة سيظل متاحًا.", "error"));
  window.addEventListener("online", () => showToast("عاد الاتصال بالإنترنت", "يمكنك الآن إرسال البيانات والتواصل بصورة طبيعية."));
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("sw.js").catch((error) => console.warn("Service worker registration failed:", error));
    });
  }
}

async function initialize() {
  cacheElements();
  elements.currentYear.textContent = new Date().getFullYear().toLocaleString("ar-EG", { useGrouping: false });
  populateSelects();
  initDatabase();
  registerEvents();
  renderAll();
  await loadProviders();
  registerServiceWorker();
}

document.addEventListener("DOMContentLoaded", initialize);
