import { useMiniApp } from 'vue-tg';


export default defineNuxtRouteMiddleware((to, from) => {
    try {
        const miniApp = useMiniApp();

        if (miniApp.platform === "unknown") {
			navigateTo("https://t.me/astrontest_bot?startapp", { external: true })
        }
    } catch {
        navigateTo("https://t.me/astrontest_bot?startapp", { external: true })
    }
});
