<script setup lang="ts">
import type { NuxtError } from "#app";

const props = defineProps<{ error: NuxtError }>();

const statusCode = computed(
  () => props.error?.statusCode ?? props.error?.status ?? 500,
);

const title = computed(() => {
  if (statusCode.value === 404) return "Sahifa topilmadi";
  if (statusCode.value === 500) return "Ulanishda xatolik";
  return "Xatolik yuz berdi";
});

const description = computed(() => {
  if (statusCode.value === 404) {
    return "Siz izlayotgan sahifa topilmadi. Ilovadan chiqib, qaytadan kiring.";
  }

  if (statusCode.value === 500) {
    return "Server bilan bog‘lanib bo‘lmadi. Internet aloqangizni tekshiring va ilovadan chiqib, qaytadan kiring.";
  }

  return "Ilovani ochishda muammo yuz berdi. Ilovadan chiqib, qaytadan kiring.";
});
</script>

<template>
  <main class="error-screen">
    <section class="error-content" role="alert">
      <svg
        class="error-icon"
        xmlns="http://www.w3.org/2000/svg"
        width="30"
        height="30"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.8"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M3 9a15 15 0 0 1 18 0" />
        <path d="M6.5 12.5a10 10 0 0 1 11 0" />
        <path d="M10 16a4 4 0 0 1 4 0" />
        <circle cx="12" cy="20" r="1" />
        <path d="M3 3l18 18" />
      </svg>

      <h1 class="error-title">{{ title }}</h1>
      <p class="error-description">{{ description }}</p>
    </section>
  </main>
</template>

<style scoped>
.error-screen {
  display: flex;
  min-height: 100vh;
  min-height: 100dvh;
  align-items: center;
  justify-content: center;
  padding: 20px;
  box-sizing: border-box;
  background: #fafafa;
  color: #171717;
  font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
}

.error-content {
  width: 100%;
  max-width: 640px;
  text-align: center;
}

.error-icon {
  display: block;
  margin: 0 auto 14px;
  color: #5c5c5c;
}

.error-title {
  margin: 0 0 15px;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.25;
}

.error-description {
  margin: 0;
  color: #777777;
  font-size: 14px;
  line-height: 1.5;
}
</style>
