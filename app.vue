<script setup lang="ts">
import { Toaster } from "@/components/ui/sonner";
import { useUserStore } from "@/stores/user";
import { storeToRefs } from "pinia";

const userStore = useUserStore();
const { token } = storeToRefs(userStore);

// PRO statusini tekshirish
const checkingStatus = ref(true);
const statusError = ref("");
const statusStartedAt = ref(0);

// Mavjud Loading Gate
const showLoadingGate = ref(false);
const loadingProgress = ref(0);

let progressTimer: ReturnType<typeof setInterval> | null = null;
let tokenTimer: ReturnType<typeof setTimeout> | null = null;
let statusController: AbortController | null = null;
let statusRequestStarted = false;
let isMounted = false;
let isDestroyed = false;

// Kamida 2 soniya kutish
const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

// PRO OFF bo'lsa, mavjud mexanizmni ishga tushirish
function startRegularEntry() {
  if (isDestroyed) return;

  showLoadingGate.value = true;
  loadingProgress.value = 0;

  // Mavjud 6 soniyalik Loading Gate
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

  // Mavjud Yandex reklama mexanizmi
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

// API javobini tekshirish
function isValidProResponse(data: any): boolean {
  return (
    data !== null &&
    typeof data === "object" &&
    typeof data.is_pro === "boolean" &&
    (data.expires_at === null ||
      typeof data.expires_at === "string") &&
    data.permissions !== null &&
    typeof data.permissions === "object" &&
    typeof data.permissions.show_ads === "boolean" &&
    typeof data.permissions.view_topic_test_results === "boolean" &&
    typeof data.permissions.access_mixed_test === "boolean" &&
    typeof data.permissions.access_mixedsubject_test === "boolean"
  );
}

// PRO statusini API orqali bir marta tekshirish
async function checkProStatus() {
  if (statusRequestStarted || isDestroyed) return;
  if (!token.value) return;

  statusRequestStarted = true;
  statusError.value = "";
  checkingStatus.value = true;

  if (tokenTimer) {
    clearTimeout(tokenTimer);
    tokenTimer = null;
  }

  const startedAt = statusStartedAt.value;

  statusController = new AbortController();

  const requestTimeout = setTimeout(() => {
    statusController?.abort();
  }, 10000);

  try {
    const response = await fetch(
      "https://astrontest.uz/mobile-api/api/prostatus.php",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: token.value,
        }),
        cache: "no-store",
        signal: statusController.signal,
      }
    );

    if (!response.ok) {
      throw new Error("PRO API xatoligi");
    }

    const data = await response.json();

    if (!isValidProResponse(data)) {
      throw new Error("PRO API javobi noto'g'ri");
    }

    // Status oynasi kamida 2 soniya ko'rinadi
    const elapsed = performance.now() - startedAt;
    if (elapsed < 2000) {
      await wait(2000 - elapsed);
    }

    if (isDestroyed) return;

    userStore.setProStatus(data);

    // PRO ON: Loading Gate va reklama yo'q
    if (data.is_pro === true) {
      showLoadingGate.value = false;
      checkingStatus.value = false;
      return;
    }

    // PRO OFF: Loading Gate va reklama bir vaqtda
    checkingStatus.value = false;
    startRegularEntry();
  } catch (error) {
    if (isDestroyed) return;

    const elapsed = performance.now() - startedAt;
    if (elapsed < 2000) {
      await wait(2000 - elapsed);
    }

    if (isDestroyed) return;

    statusError.value =
      "Statusni tekshirib bo'lmadi. Qayta urinib ko'ring.";
    checkingStatus.value = true;
  } finally {
    clearTimeout(requestTimeout);
    statusController = null;
  }
}

// Token kechroq yuklansa, uni kutish
function startStatusCheck() {
  statusStartedAt.value = performance.now();
  statusRequestStarted = false;
  statusError.value = "";
  checkingStatus.value = true;

  userStore.resetProStatus();

  if (token.value) {
    void checkProStatus();
    return;
  }

  // Token 10 soniyada kelmasa, xabar chiqariladi
  tokenTimer = setTimeout(() => {
    if (!statusRequestStarted && !isDestroyed) {
      statusError.value =
        "Foydalanuvchi tokeni aniqlanmadi.";
    }
  }, 10000);
}

// Qayta tekshirish
function retryStatusCheck() {
  if (tokenTimer) {
    clearTimeout(tokenTimer);
    tokenTimer = null;
  }

  startStatusCheck();
}

// Token paydo bo'lishini kuzatish
watch(token, (newToken) => {
  if (
    isMounted &&
    newToken &&
    checkingStatus.value &&
    !statusRequestStarted &&
    !statusError.value
  ) {
    void checkProStatus();
  }
});

onMounted(() => {
  isMounted = true;
  startStatusCheck();
});

onBeforeUnmount(() => {
  isDestroyed = true;

  if (progressTimer) {
    clearInterval(progressTimer);
    progressTimer = null;
  }

  if (tokenTimer) {
    clearTimeout(tokenTimer);
    tokenTimer = null;
  }

  statusController?.abort();
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
      <!-- PRO statusini tekshirish oynasi -->
      <div v-if="checkingStatus" class="status-check">
        <div class="status-check__content">
          <template v-if="!statusError">
            <span>Status tekshiruvi</span>
            <span class="status-check__dots">
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </span>
          </template>

          <template v-else>
            <div class="status-check__error">
              {{ statusError }}
            </div>

            <button
              class="status-check__retry"
              type="button"
              @click="retryStatusCheck"
            >
              Qayta tekshirish
            </button>
          </template>
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
/* PRO statusini tekshirish oynasi */

.status-check {
  position: fixed;
  inset: 0;
  z-index: 2000;
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

.status-check__content {
  text-align: center;
  font-size: 18px;
  font-weight: 400;
  line-height: 1.4;
}

.status-check__dots {
  display: inline-flex;
  width: 18px;
  justify-content: flex-start;
}

.status-check__dots span {
  opacity: 0.15;
  animation: status-dot 1.2s infinite;
}

.status-check__dots span:nth-child(1) {
  animation-delay: 0s;
}

.status-check__dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.status-check__dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes status-dot {
  0%, 20% {
    opacity: 0.15;
  }

  30%, 55% {
    opacity: 1;
  }

  65%, 100% {
    opacity: 0.15;
  }
}

.status-check__error {
  max-width: 300px;
  font-size: 16px;
  line-height: 1.5;
}

.status-check__retry {
  margin-top: 18px;
  padding: 10px 18px;
  border: none;
  border-radius: 8px;
  background: #333333;
  color: #ffffff;
  font-size: 15px;
  cursor: pointer;
}

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
