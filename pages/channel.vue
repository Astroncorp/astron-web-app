<script setup lang="ts">
import { useMiniApp } from "vue-tg";

// Bot menyusidan kirgan foydalanuvchini ASTRON kanaliga yo'naltirish.
// Manzil doimiy: foydalanuvchi ma'lumotlari yoki token yuborilmaydi.
const CHANNEL_URL = "https://t.me/astron_onlayn_test";
const miniApp = useMiniApp();

// Telegram ichida rasmiy API; oddiy brauzerda esa odatiy havola.
const openChannel = () => {
  if (!import.meta.client) return;

  try {
    if (miniApp.platform !== "unknown") {
      miniApp.openTelegramLink(CHANNEL_URL);
      return;
    }
  } catch {
    // Telegram API ishlamasa, quyidagi odatiy havolaga o'tamiz.
  }

  window.location.assign(CHANNEL_URL);
};

// Sahifa ochilishi bilan kanalga o'tishga urinadi.
// Ba'zi Telegram versiyalarida avtomatik o'tish cheklanishi mumkin;
// shu bois qo'lda bosiladigan tugma doim ko'rinib turadi.
onMounted(() => {
  try {
    if (miniApp.platform !== "unknown") miniApp.ready();
  } catch {
    // O'tish tugmasi bu holatda ham ishlaydi.
  }

  openChannel();
});

definePageMeta({ layout: false });
</script>

<template>
  <main class="channel-page">
    <section class="channel-card">
      <div class="channel-symbol" aria-hidden="true">✈</div>
      <h1>ASTRON kanaliga o'tish</h1>
      <p>
        Telegram kanalimiz ochilmoqda. Kanalda
        <strong>«Test ishlash»</strong> tugmasi orqali ilovaga kirishingiz mumkin.
      </p>
      <a
        class="channel-button"
        :href="CHANNEL_URL"
        @click.prevent="openChannel"
      >
        Ilovaga o'tish
      </a>
      <p class="channel-hint">
        Agar kanal avtomatik ochilmasa, yuqoridagi tugmani bosing.
      </p>
    </section>
  </main>
</template>

<style scoped>
.channel-page {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  min-height: 100dvh;
  padding: 24px 18px;
  padding-top: calc(24px + env(safe-area-inset-top, 0px));
  padding-bottom: calc(24px + env(safe-area-inset-bottom, 0px));
  background: #fff7ed;
  color: #1f2937;
  text-align: center;
}
.channel-card {
  box-sizing: border-box;
  width: 100%;
  max-width: 390px;
  padding: 30px 22px;
  border: 1px solid #fed7aa;
  border-radius: 18px;
  background: #ffffff;
}
.channel-symbol {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 58px;
  height: 58px;
  margin: 0 auto 16px;
  border-radius: 50%;
  background: #fff0dc;
  color: #ea580c;
  font-size: 28px;
}
h1 {
  margin: 0 0 12px;
  font-size: 22px;
  font-weight: 700;
  line-height: 1.3;
}
p {
  margin: 0;
  font-size: 15px;
  line-height: 1.55;
}
.channel-button {
  box-sizing: border-box;
  display: block;
  width: 100%;
  margin-top: 24px;
  padding: 14px 16px;
  border-radius: 10px;
  background: #ea580c;
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.3;
  text-decoration: none;
}
.channel-button:focus-visible {
  outline: 3px solid #fb923c;
  outline-offset: 3px;
}
.channel-hint {
  margin-top: 14px;
  color: #6b7280;
  font-size: 13px;
}
</style>
