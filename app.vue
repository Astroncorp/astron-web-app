<script setup lang="ts">
import { Toaster } from "@/components/ui/sonner";
import { useUserStore } from "@/stores/user";
import { storeToRefs } from "pinia";

// PRO tekshiruvi Loading Gate va Yandex Ads dan mustaqil ishlaydi.
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

let proStatusController: AbortController | null = null;
let proStatusRequestId = 0;

async function checkProStatusInBackground(userToken: string, requestId: number) {
  const controller = new AbortController();
  proStatusController = controller;
  const timeout = setTimeout(() => controller.abort(), 8000);

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

    // Eskirgan javob yangi foydalanuvchi holatini o'zgartirmasin.
    if (!isDestroyed && requestId === proStatusRequestId && token.value === userToken) {
      userStore.setProStatus(data);
    }
  } catch (error) {
    // Xatolik WebApp ochilishiga ta'sir qilmaydi. PRO huquqlari tasdiqlanmaydi.
    if (!isDestroyed && requestId === proStatusRequestId && token.value === userToken) {
      userStore.resetProStatus();
      console.warn("PRO statusini fon rejimida tekshirish amalga oshmadi.");
    }
  } finally {
    clearTimeout(timeout);
    if (proStatusController === controller) proStatusController = null;
  }
}


// Mavjud Loading Gate: barcha foydalanuvchilar uchun.
const showLoadingGate = ref(false);
const loadingProgress = ref(0);

let progressTimer: ReturnType<typeof setInterval> | null = null;
let isDestroyed = false;

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

  // Mavjud Yandex reklama mexanizmi (o'zgartirilmagan).
  window.yaContextCb = window.yaContextCb || [];

  if (
    window.yaContextCb ||
    window.yaContextCb !== null ||
    window.yaContextCb !== undefined
  ) {
    window.yaContextCb.push(() => {
      Ya.Context.AdvManager.render({
        blockId: "R-A-19395198-2",
        type: "fullscreen",
        platform: "touch",
      });
    });
  }
}

onMounted(() => {
  // Loading Gate va reklama PRO natijasini kutmasdan ishga tushadi.
  startRegularEntry();
});

// Token index.vue da olingach, PRO tekshiruvi alohida boshlanadi.
watch(
  token,
  (newToken) => {
    proStatusRequestId++;
    proStatusController?.abort();
    proStatusController = null;
    userStore.resetProStatus();

    if (isDestroyed || !newToken) return;
    void checkProStatusInBackground(newToken, proStatusRequestId);
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  isDestroyed = true;
  proStatusRequestId++;
  proStatusController?.abort();
  proStatusController = null;

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
</style>
