<script setup lang="ts">
import { Toaster } from "@/components/ui/sonner";
import { useUserStore } from "@/stores/user";
import { storeToRefs } from "pinia";

// Kirishda PRO tekshiruvi: kamida 2, ko'pi bilan 5 soniya.
// Token index.vue ichida olinadi; NuxtPage tekshiruv vaqtida ham mount bo'ladi.
const userStore = useUserStore();
const { token } = storeToRefs(userStore);

interface ProStatusResponse {
  is_pro: boolean;
  expires_at: string | null;
  permissions: {
    show_ads: boolean;
    view_topic_test_results: boolean;
    access_mixed_test: boolean;
    access_mixedsubject_test: boolean;
  };
}

function isValidProResponse(value: unknown): value is ProStatusResponse {
  if (!value || typeof value !== "object") return false;
  const data = value as Record<string, unknown>;
  if (typeof data.is_pro !== "boolean") return false;
  if (data.expires_at !== null && typeof data.expires_at !== "string") return false;
  if (!data.permissions || typeof data.permissions !== "object") return false;

  const permissions = data.permissions as Record<string, unknown>;
  return (
    typeof permissions.show_ads === "boolean" &&
    typeof permissions.view_topic_test_results === "boolean" &&
    typeof permissions.access_mixed_test === "boolean" &&
    typeof permissions.access_mixedsubject_test === "boolean"
  );
}

const showProCheck = ref(false);
let isDestroyed = false;
let entryDecided = false;
let checkStartedAt = 0;
let proStatusController: AbortController | null = null;
let minimumTimer: ReturnType<typeof setTimeout> | null = null;
let maximumTimer: ReturnType<typeof setTimeout> | null = null;

function finishEntry(isPro: boolean) {
  if (isDestroyed || entryDecided) return;
  entryDecided = true;
  if (minimumTimer) clearTimeout(minimumTimer);
  if (maximumTimer) clearTimeout(maximumTimer);
  minimumTimer = null;
  maximumTimer = null;
  proStatusController?.abort();
  proStatusController = null;
  showProCheck.value = false;

  if (!isPro) startRegularEntry();
}

function finishAfterMinimum(isPro: boolean) {
  if (isDestroyed || entryDecided) return;
  const remaining = Math.max(0, 2000 - (performance.now() - checkStartedAt));
  if (remaining === 0) finishEntry(isPro);
  else minimumTimer = setTimeout(() => finishEntry(isPro), remaining);
}

async function checkProStatus(userToken: string) {
  const controller = new AbortController();
  proStatusController = controller;

  try {
    const response = await fetch(
      "https://astrontest.uz/mobile-api/api/prostatus.php",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: userToken }),
        cache: "no-store",
        signal: controller.signal,
      },
    );
    if (!response.ok) throw new Error(`PRO API HTTP ${response.status}`);
    const data: unknown = await response.json();
    if (!isValidProResponse(data)) throw new Error("Invalid PRO API response");
    if (isDestroyed || entryDecided || token.value !== userToken) return;

    userStore.setProStatus(data);
    finishAfterMinimum(data.is_pro);
  } catch {
    if (isDestroyed || entryDecided || token.value !== userToken) return;
    userStore.resetProStatus();
    console.warn("PRO status tekshiruvi amalga oshmadi; odatiy kirish davom etadi.");
    finishAfterMinimum(false);
  }
}

// Mavjud Loading Gate: barcha foydalanuvchilar uchun.
const showLoadingGate = ref(false);
const loadingProgress = ref(0);

let progressTimer: ReturnType<typeof setInterval> | null = null;
function startRegularEntry() {
  if (isDestroyed) return;

  showLoadingGate.value = true;
  loadingProgress.value = 0;

  // Mavjud 6 soniyalik Loading Gate.
  const gateStartedAt = performance.now();
  const progressDuration = 5000;
  const gateDuration = 6000;

  const updateLoadingProgress = () => {
    const elapsed = performance.now() - gateStartedAt;
    const step = Math.min(5, Math.floor(elapsed / 1000));

    loadingProgress.value =
      elapsed >= progressDuration ? 100 : step * 20;

    if (elapsed >= gateDuration) {
      showLoadingGate.value = false;

      if (progressTimer) {
        clearInterval(progressTimer);
        progressTimer = null;
      }
    }
  };

  updateLoadingProgress();
  progressTimer = setInterval(updateLoadingProgress, 100);

  // Yandex fullscreen: mavjud format va chaqirish vaqti saqlangan.
  // Faqat noto'g'ri shart olib tashlanib, xatolar va render hodisasi kuzatiladi.
  window.yaContextCb = window.yaContextCb || [];
  window.yaContextCb.push(() => {
    try {
      if (
        typeof Ya === "undefined" ||
        typeof Ya.Context?.AdvManager?.render !== "function"
      ) {
        console.warn("[Astron Yandex Ads] AdvManager mavjud emas");
        return;
      }

      Ya.Context.AdvManager.render({
        blockId: "R-A-19395198-2",
        type: "fullscreen",
        platform: "touch",
        onError: (data: { type?: string; code?: string; text?: string }) => {
          console.warn("[Astron Yandex Ads] onError:", data.type, data.code, data.text);
        },
        // Yandex hujjatlariga ko'ra onRender eng oxirgi parametr bo'lishi kerak.
        onRender: (data: { product?: string }) => {
          console.info("[Astron Yandex Ads] onRender:", data.product);
        },
      });
    } catch (error) {
      // Sinxron xatolik ham WebApp kirish jarayonini to'xtatmasin.
      console.error("[Astron Yandex Ads] render xatosi:", error);
    }
  });
}

onMounted(() => {
  userStore.resetProStatus();
  checkStartedAt = performance.now();
  showProCheck.value = true;

  // 5 soniya tokenni olish va API javobi uchun umumiy limit.
  maximumTimer = setTimeout(() => {
    if (entryDecided || isDestroyed) return;
    userStore.resetProStatus();
    finishEntry(false);
  }, 5000);

  // Token index.vue da kelishi bilan tekshiruv boshlanadi.
  // Timeoutdan keyin qayta tekshirish avtomatik ishga tushmaydi.
  if (token.value) void checkProStatus(token.value);
});

watch(token, (newToken, oldToken) => {
  if (isDestroyed || entryDecided || !showProCheck.value) return;
  if (newToken === oldToken) return;
  proStatusController?.abort();
  proStatusController = null;
  if (minimumTimer) clearTimeout(minimumTimer);
  minimumTimer = null;
  userStore.resetProStatus();
  if (newToken) void checkProStatus(newToken);
});

onBeforeUnmount(() => {
  isDestroyed = true;
  proStatusController?.abort();
  if (minimumTimer) clearTimeout(minimumTimer);
  if (maximumTimer) clearTimeout(maximumTimer);
  if (progressTimer) {
    clearInterval(progressTimer);
    progressTimer = null;
  }
});
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtLoadingIndicator />

    <ClientOnly>
      <Toaster position="top-left" />
    </ClientOnly>

    <NuxtLayout>
      <ClientOnly>
        <NuxtPage />
      </ClientOnly>
    </NuxtLayout>

    <ClientOnly>
      <!-- PRO status tekshiruvi: ilova fonida yuklanishda davom etadi -->
      <div v-if="showProCheck" class="loading-gate" aria-live="polite">
        <div class="loading-gate__content">
          <div class="loading-gate__title">PRO status tekshirilmoqda...</div>
          <div class="pro-check__spinner" aria-hidden="true"></div>
        </div>
      </div>

      <!-- Mavjud Loading Gate -->
      <div v-if="showLoadingGate" class="loading-gate">
        <div class="loading-gate__content">
          <div class="loading-gate__title">
            Ilova yuklanmoqda...
          </div>

          <div class="loading-gate__progress-track">
            <div
              class="loading-gate__progress-fill"
              :style="{ width: `${loadingProgress}%` }"
            ></div>
          </div>

          <div class="loading-gate__percent">
            {{ loadingProgress }}%
          </div>
        </div>
      </div>
    </ClientOnly>
  </div>
</template>

<style scoped>
/* Mavjud Loading Gate — o'zgartirilmagan */

.loading-gate {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 100%;
  height: 100vh;
  height: 100dvh;
  padding: 24px 20px 36px;
  background: #ffffff;
  color: #111111;
  touch-action: none;
  overscroll-behavior: none;
}

.loading-gate__content {
  width: min(82vw, 330px);
  text-align: center;
}

.loading-gate__title {
  margin-bottom: 16px;
  font-size: 17px;
  font-weight: 600;
  line-height: 1.3;
}

.loading-gate__progress-track {
  overflow: hidden;
  width: 100%;
  height: 13px;
  border-radius: 999px;
  background: #e6e6e6;
}

.loading-gate__progress-fill {
  height: 100%;
  border-radius: inherit;
  background: #333333;
  transition: width 180ms ease-out;
}

.loading-gate__percent {
  margin-top: 10px;
  font-size: 16px;
  font-weight: 500;
  line-height: 1.2;
}

.pro-check__spinner {
  width: 32px;
  height: 32px;
  margin: 18px auto 0;
  border: 3px solid #e6e6e6;
  border-top-color: #333333;
  border-radius: 50%;
  animation: pro-check-spin 0.8s linear infinite;
}
@keyframes pro-check-spin {
  to { transform: rotate(360deg); }
}
</style>
