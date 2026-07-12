"use strict";

(function initializeRatingsModule() {
  const ratingsState = {
    summaries: new Map(),
    currentProviderId: null,
    selectedStars: 0,
    voterId: null
  };

  function ensureVoterId() {
    const key = "estabari_rating_voter_id";
    let id = localStorage.getItem(key);
    if (id) return id;

    if (window.crypto?.randomUUID) {
      id = window.crypto.randomUUID();
    } else {
      id = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
        const random = Math.random() * 16 | 0;
        const value = character === "x" ? random : (random & 0x3 | 0x8);
        return value.toString(16);
      });
    }

    localStorage.setItem(key, id);
    return id;
  }

  function injectRatingStyles() {
    if (document.getElementById("ratingsStyles")) return;

    const style = document.createElement("style");
    style.id = "ratingsStyles";
    style.textContent = `
      .provider-rating-summary {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        margin-top: 14px;
        padding: 11px 12px;
        border: 1px solid #3d372d;
        border-radius: 13px;
        background: #181715;
      }

      .provider-rating-score {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }

      .provider-rating-score strong {
        color: #e7bd58;
        font-size: 15px;
        line-height: 1;
      }

      .provider-rating-stars {
        color: #e4b84f;
        font-size: 14px;
        letter-spacing: 1px;
        white-space: nowrap;
      }

      .provider-rating-score small {
        color: #918978;
        font-size: 9px;
        white-space: nowrap;
      }

      .rate-provider-button {
        flex: 0 0 auto;
        min-height: 34px;
        padding: 6px 10px;
        border: 1px solid #5a4930;
        border-radius: 9px;
        background: #242016;
        color: #e7bd58;
        font-family: inherit;
        font-size: 9px;
        font-weight: 900;
      }

      .rate-provider-button:hover {
        border-color: #e4b84f;
        background: #2c2415;
      }

      .rating-dialog {
        width: min(470px, calc(100% - 28px));
        padding: 0;
        border: 1px solid #453d31;
        border-radius: 22px;
        background: #121212;
        color: #f7efdf;
        box-shadow: 0 35px 95px rgba(0, 0, 0, 0.65);
      }

      .rating-dialog::backdrop {
        background: rgba(0, 0, 0, 0.8);
        backdrop-filter: blur(5px);
      }

      .rating-dialog-shell {
        padding: 27px;
        text-align: center;
      }

      .rating-dialog-close {
        position: absolute;
        top: 14px;
        left: 14px;
        width: 36px;
        height: 36px;
        border: 1px solid #403a31;
        border-radius: 10px;
        background: #1d1d1d;
        color: #c8bdab;
        font-size: 22px;
      }

      .rating-dialog-icon {
        display: grid;
        place-items: center;
        width: 58px;
        height: 58px;
        margin: 0 auto 13px;
        border-radius: 17px;
        background: #242016;
        font-size: 27px;
      }

      .rating-dialog h2 {
        margin: 0 0 5px;
        color: #f7efdf;
        font-size: 23px;
      }

      .rating-dialog p {
        margin: 0;
        color: #a79d8b;
        font-size: 11px;
      }

      .rating-stars-picker {
        display: flex;
        direction: ltr;
        justify-content: center;
        gap: 5px;
        margin: 25px 0 10px;
      }

      .rating-stars-picker button {
        padding: 2px;
        border: 0;
        background: transparent;
        color: #4f493f;
        font-size: 39px;
        line-height: 1;
        transition: transform 130ms ease, color 130ms ease;
      }

      .rating-stars-picker button.active,
      .rating-stars-picker button:hover {
        color: #e4b84f;
        transform: scale(1.08);
      }

      .rating-selection-label {
        min-height: 24px;
        color: #e7bd58 !important;
        font-weight: 800;
      }

      .rating-dialog-actions {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        margin-top: 20px;
      }

      .rating-dialog-actions button {
        min-height: 44px;
        border-radius: 11px;
        font-family: inherit;
        font-weight: 900;
      }

      .rating-cancel-button {
        border: 1px solid #403a31;
        background: #1d1c1a;
        color: #c7bcaa;
      }

      .rating-submit-button {
        border: 1px solid #d4a640;
        background: linear-gradient(145deg, #ecc45e, #b98020);
        color: #171105;
      }

      .rating-submit-button:disabled {
        cursor: not-allowed;
        opacity: 0.55;
      }

      .rating-privacy-note {
        margin-top: 13px !important;
        color: #746d61 !important;
        font-size: 9px !important;
      }

      @media (max-width: 620px) {
        .provider-rating-summary {
          align-items: stretch;
          flex-direction: column;
        }

        .rate-provider-button {
          width: 100%;
        }

        .rating-dialog {
          width: calc(100% - 18px);
        }
      }
    `;
    document.head.appendChild(style);
  }

  function injectRatingDialog() {
    if (document.getElementById("ratingDialog")) return;

    document.body.insertAdjacentHTML(
      "beforeend",
      `
        <dialog class="rating-dialog" id="ratingDialog" aria-labelledby="ratingDialogTitle">
          <div class="rating-dialog-shell">
            <button class="rating-dialog-close" id="ratingDialogClose" type="button" aria-label="إغلاق">×</button>
            <div class="rating-dialog-icon" aria-hidden="true">⭐</div>
            <h2 id="ratingDialogTitle">قيّم مقدم الخدمة</h2>
            <p id="ratingProviderName"></p>
            <div class="rating-stars-picker" id="ratingStarsPicker" aria-label="اختر عدد النجوم">
              <button type="button" data-rating-star="1" aria-label="نجمة واحدة">★</button>
              <button type="button" data-rating-star="2" aria-label="نجمتان">★</button>
              <button type="button" data-rating-star="3" aria-label="3 نجوم">★</button>
              <button type="button" data-rating-star="4" aria-label="4 نجوم">★</button>
              <button type="button" data-rating-star="5" aria-label="5 نجوم">★</button>
            </div>
            <p class="rating-selection-label" id="ratingSelectionLabel">اختار تقييمك من نجمة إلى 5</p>
            <div class="rating-dialog-actions">
              <button class="rating-cancel-button" id="ratingCancelButton" type="button">إلغاء</button>
              <button class="rating-submit-button" id="ratingSubmitButton" type="button" disabled>حفظ التقييم</button>
            </div>
            <p class="rating-privacy-note">يُسمح بتقييم واحد لكل متصفح لكل خدمة، ويمكن تعديل التقييم لاحقًا.</p>
          </div>
        </dialog>
      `
    );
  }

  function getStoredRating(providerId) {
    return Number(localStorage.getItem(`estabari_my_rating_${providerId}`) || 0);
  }

  function saveStoredRating(providerId, stars) {
    localStorage.setItem(`estabari_my_rating_${providerId}`, String(stars));
  }

  function getSummary(providerId) {
    return ratingsState.summaries.get(String(providerId)) || {
      average: 0,
      count: 0
    };
  }

  function renderStarsValue(average) {
    const rounded = Math.round(Number(average || 0));
    return `${"★".repeat(rounded)}${"☆".repeat(Math.max(0, 5 - rounded))}`;
  }

  function ratingBlock(provider) {
    const summary = getSummary(provider.id);
    const averageText = summary.count ? Number(summary.average).toFixed(1) : "جديد";
    const countText = summary.count
      ? `${Number(summary.count).toLocaleString("ar-EG")} تقييم`
      : "بدون تقييمات";
    const ownRating = getStoredRating(provider.id);

    return `
      <div class="provider-rating-summary">
        <div class="provider-rating-score" title="متوسط تقييم الخدمة">
          <strong>${averageText}</strong>
          <span class="provider-rating-stars" aria-label="متوسط التقييم">${renderStarsValue(summary.average)}</span>
          <small>${countText}</small>
        </div>
        <button class="rate-provider-button" type="button" data-rate-provider="${escapeHtml(provider.id)}">
          ${ownRating ? `تعديل تقييمي (${ownRating}★)` : "قيّم الخدمة"}
        </button>
      </div>
    `;
  }

  async function loadRatingSummaries() {
    if (!state.databaseEnabled || !state.supabase) return;

    try {
      const { data, error } = await state.supabase.rpc("get_provider_rating_summaries");
      if (error) throw error;

      ratingsState.summaries.clear();
      (data || []).forEach((item) => {
        ratingsState.summaries.set(String(item.provider_id), {
          average: Number(item.average_rating || 0),
          count: Number(item.ratings_count || 0)
        });
      });
    } catch (error) {
      console.warn("Could not load provider ratings:", error);
    }
  }

  function updatePicker() {
    const labels = [
      "اختار تقييمك من نجمة إلى 5",
      "ضعيفة",
      "مقبولة",
      "جيدة",
      "جيدة جدًا",
      "ممتازة"
    ];

    document.querySelectorAll("[data-rating-star]").forEach((button) => {
      const value = Number(button.dataset.ratingStar);
      button.classList.toggle("active", value <= ratingsState.selectedStars);
      button.setAttribute("aria-pressed", String(value === ratingsState.selectedStars));
    });

    const label = document.getElementById("ratingSelectionLabel");
    const submit = document.getElementById("ratingSubmitButton");
    if (label) label.textContent = labels[ratingsState.selectedStars] || labels[0];
    if (submit) submit.disabled = ratingsState.selectedStars < 1;
  }

  function openRatingDialog(providerId) {
    const provider = state.providers.find((item) => String(item.id) === String(providerId));
    if (!provider || provider.isDemo) return;

    ratingsState.currentProviderId = provider.id;
    ratingsState.selectedStars = getStoredRating(provider.id);

    const name = document.getElementById("ratingProviderName");
    if (name) name.textContent = `${provider.name} — ${provider.serviceName}`;

    updatePicker();
    const dialog = document.getElementById("ratingDialog");
    if (dialog?.showModal) {
      dialog.showModal();
      document.body.classList.add("dialog-open");
    }
  }

  function closeRatingDialog() {
    const dialog = document.getElementById("ratingDialog");
    if (dialog?.open) dialog.close();
    document.body.classList.remove("dialog-open");
    ratingsState.currentProviderId = null;
    ratingsState.selectedStars = 0;
  }

  async function submitRating() {
    if (!state.databaseEnabled || !state.supabase) {
      showToast("التقييم غير متاح مؤقتًا", "قاعدة البيانات غير متصلة حاليًا.", "error");
      return;
    }

    if (!ratingsState.currentProviderId || ratingsState.selectedStars < 1) return;

    const button = document.getElementById("ratingSubmitButton");
    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = "جاري الحفظ...";

    try {
      const { error } = await state.supabase.rpc("submit_provider_rating", {
        p_provider_id: ratingsState.currentProviderId,
        p_voter_id: ratingsState.voterId,
        p_stars: ratingsState.selectedStars
      });

      if (error) throw error;

      saveStoredRating(ratingsState.currentProviderId, ratingsState.selectedStars);
      closeRatingDialog();
      await loadRatingSummaries();
      renderProviders();
      showToast("تم حفظ تقييمك", "شكرًا لمساعدتك أهل البلد في اختيار مقدم الخدمة المناسب.");
    } catch (error) {
      console.error("Rating submission failed:", error);
      showToast("لم يتم حفظ التقييم", "راجع الاتصال ثم حاول مرة أخرى.", "error");
      button.disabled = false;
      button.textContent = originalText;
    }
  }

  function enhanceProviderCards() {
    if (typeof providerCard !== "function" || providerCard.__ratingsEnhanced) return;

    const originalProviderCard = providerCard;
    const enhancedProviderCard = function enhancedProviderCard(provider) {
      const html = originalProviderCard(provider);
      if (provider.isDemo) return html;
      return html.replace(
        '<div class="provider-actions">',
        `${ratingBlock(provider)}<div class="provider-actions">`
      );
    };

    enhancedProviderCard.__ratingsEnhanced = true;
    providerCard = enhancedProviderCard;
  }

  function addHighestRatedSort() {
    if (!elements.sortFilter || elements.sortFilter.querySelector('option[value="rating"]')) return;
    elements.sortFilter.insertAdjacentHTML("beforeend", '<option value="rating">الأعلى تقييمًا</option>');

    if (typeof getFilteredProviders !== "function" || getFilteredProviders.__ratingsEnhanced) return;
    const originalGetFilteredProviders = getFilteredProviders;
    const enhancedGetFilteredProviders = function enhancedGetFilteredProviders() {
      const providers = originalGetFilteredProviders();
      if (state.sort === "rating") {
        providers.sort((a, b) => {
          const ratingA = getSummary(a.id);
          const ratingB = getSummary(b.id);
          return ratingB.average - ratingA.average
            || ratingB.count - ratingA.count
            || new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });
      }
      return providers;
    };
    enhancedGetFilteredProviders.__ratingsEnhanced = true;
    getFilteredProviders = enhancedGetFilteredProviders;
  }

  function registerRatingEvents() {
    document.addEventListener("click", (event) => {
      const rateButton = event.target.closest("[data-rate-provider]");
      if (rateButton) openRatingDialog(rateButton.dataset.rateProvider);

      const starButton = event.target.closest("[data-rating-star]");
      if (starButton) {
        ratingsState.selectedStars = Number(starButton.dataset.ratingStar);
        updatePicker();
      }
    });

    document.getElementById("ratingDialogClose")?.addEventListener("click", closeRatingDialog);
    document.getElementById("ratingCancelButton")?.addEventListener("click", closeRatingDialog);
    document.getElementById("ratingSubmitButton")?.addEventListener("click", submitRating);
    document.getElementById("ratingDialog")?.addEventListener("click", (event) => {
      if (event.target.id === "ratingDialog") closeRatingDialog();
    });
    document.getElementById("ratingDialog")?.addEventListener("close", () => {
      document.body.classList.remove("dialog-open");
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    if (typeof state === "undefined" || typeof elements === "undefined") return;

    ratingsState.voterId = ensureVoterId();
    injectRatingStyles();
    injectRatingDialog();
    enhanceProviderCards();
    addHighestRatedSort();
    registerRatingEvents();

    await loadRatingSummaries();
    if (typeof renderProviders === "function") renderProviders();
  });
})();
