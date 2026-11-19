<script setup lang="ts">
import {
	LucideChevronRight,
	LucideMessageCircleQuestion,
	LucideWallet,
	LucideFile,
	LucideLoader,
	LucideListCheck,
	LucideRefreshCw,
	LucideBell,
	LucideShare,
	LucideUsers,
} from "lucide-vue-next";
import { toast } from "vue-sonner";
import { useMiniApp } from "vue-tg";

const route = useRoute();
const miniApp = useMiniApp();

const userStore = useUserStore();
const { balance, isPro, proStatusChecked } = storeToRefs(userStore);

const newFile = ref(false);

const isLoading = ref(true);
const announcement = ref("");
const created = ref("");
const status = ref("");
const isWaiting = ref(true);
const channelRecommendation = ref<{
	id: number;
	content: string;
	post_url: string;
} | null>(null);

miniApp.ready();

const user = computed(() => {
	if (miniApp.initDataUnsafe.user) {
		if (miniApp.initDataUnsafe.user.first_name) {
			return miniApp.initDataUnsafe.user.first_name;
		} else if (miniApp.initDataUnsafe.user.username) {
			return miniApp.initDataUnsafe.user.username;
		} else {
			return miniApp.initDataUnsafe.user.id;
		}
	} else {
		return "User";
	}
});

const login = async () => {
	// create a new user
	isLoading.value = true;
	let response = await $fetch<{
		success: boolean;
		token: string;
		balance: string;
		new_file: boolean;
	}>(
		`https://astrontest.uz/mobile-api/api/uz/get-token?tg_id=${miniApp.initDataUnsafe.user?.id}`,
		{
			method: "POST",
			body: JSON.stringify({
				chat_id: miniApp.initDataUnsafe.user?.id,
			}),
			headers: {
				"Content-Type": "application/json",
			},
		},
	);
	await $fetch("https://backend.astron.uz/api/v1/telemetry/", {
		method: "POST",
		body: JSON.stringify({
			id: miniApp.initDataUnsafe.user?.id,
			username: miniApp.initDataUnsafe.user?.username,
			first_name: miniApp.initDataUnsafe.user?.first_name,
			last_name: miniApp.initDataUnsafe.user?.last_name,
		}),
	});
	userStore.setToken(response.token);
	userStore.setBalance(response.balance);
	newFile.value = response.new_file;
	isLoading.value = false;
};

const loadChannelRecommendation = async () => {
	const userId = miniApp.initDataUnsafe.user?.id;
	if (!userId) return;

	try {
		const response = await $fetch<{
			id: number | null;
			content: string | null;
			post_url: string | null;
		}>("https://backend.astron.uz/api/v1/channel-recommendation/", {
			query: { user_id: String(userId) },
		});

		if (
			typeof response.id === "number" &&
			response.content &&
			response.post_url
		) {
			channelRecommendation.value = {
				id: response.id,
				content: response.content,
				post_url: response.post_url,
			};
		}
	} catch (error) {
		console.error("Kanaldan tavsiyani yuklashda xatolik:", error);
	}
};

const dismissChannelRecommendation = (openPost: boolean) => {
	const recommendation = channelRecommendation.value;
	const userId = miniApp.initDataUnsafe.user?.id;
	if (!recommendation || !userId) return;

	channelRecommendation.value = null;

	// Saqlashni kutmasdan Telegram havolasini foydalanuvchi bosgan paytda ochamiz.
	void $fetch("https://backend.astron.uz/api/v1/channel-recommendation/dismiss/", {
		method: "POST",
		body: {
			user_id: String(userId),
			recommendation_id: recommendation.id,
		},
		keepalive: true,
	}).catch((error) => {
		console.error("Kanaldan tavsiya holatini saqlashda xatolik:", error);
	});

	if (openPost) {
		if (
			window.Telegram?.WebApp &&
			/^https:\/\/t\.me\//i.test(recommendation.post_url)
		) {
			window.Telegram.WebApp.openTelegramLink(recommendation.post_url);
		} else {
			window.open(recommendation.post_url, "_blank", "noopener,noreferrer");
		}
	}
};

definePageMeta({
	middleware: ["is-telegram", "get-subjects"],
});

useSeoMeta({
	title: "Astron",
});

onMounted(async () => {
	void login().catch((error) => {
		console.error("Foydalanuvchini yuklashda xatolik:", error);
	}).then(loadChannelRecommendation);
	isLoading.value = false;

	let response1 = await $fetch<{
		status: "success" | "error";
		code: string;
		data: string;
	}>(
		`https://bot.astron.uz/is-chat-member/?user_id=${miniApp.initDataUnsafe.user?.id}&chat_id=@astron_onlayn_test`,
	);
	status.value = response1.data;
	isWaiting.value = false;

	let response = await $fetch<{ content: string; created: string }>(
		"https://backend.astron.uz/api/v1/announcement/",
	);
	announcement.value = response.content;
	created.value = response.created;

	const postID = route.query.tgWebAppStartParam || null;
	if (postID !== null) {
		let response = await $fetch<{ claimed: boolean }>(
			"https://backend.astron.uz/api/v1/bonus/",
			{
				method: "POST",
				body: JSON.stringify({
					user_id: miniApp.initDataUnsafe.user?.id,
					post_id: postID,
				}),
			},
		);

		if (response.claimed) {
			toast("✅Balansingizga 1 000 so'm bonus o'tkazildi", {
				action: {
					label: "Tekshirish",
					onClick: () => {
						login();
					},
				},
				duration: 5000,
			});
		} else {
			toast("❌Siz ushbu post uchun allaqachon bonus olgansiz!", {
				duration: 5000,
			});
		}
	}
});

const shareApp = () => {
	const shareUrl = "https://t.me/astrontest_bot";

	const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}`;

	if (window.Telegram?.WebApp) {
		window.Telegram.WebApp.openTelegramLink(tgUrl);
	} else {
		window.open(tgUrl, "_blank");
	}
};

</script>

<template>
	<div
		v-if="isLoading"
		class="h-screen w-full flex items-center justify-center"
	>
		<LucideLoader class="animate-spin" />
	</div>
	<div
		v-else
		class="h-screen w-full bg-gradient-to-r from-yellow-500 via-orange-500 to-orange-500"
	>
		<!-- <div v-if="!isWaiting">
			<div
				v-if="
					status != 'member' &&
					status != 'administrator' &&
					status != 'creator'
				"
				class="z-50 fixed top-0 left-0 w-full bg-accent/50 h-screen flex flex-col items-center justify-center px-10"
			>
				<div
					class="border bg-background p-5 rounded-md flex flex-col gap-5"
				>
					<p class="text-center text-lg">
						Ilovadan foydalanish uchun rasmiy Telegram kanalimizga
						obuna bo'ling.
					</p>
					<NuxtLink
						class="w-full"
						:class="buttonVariants({ variant: 'default' })"
						to="https://t.me/astron_onlayn_test"
						>Kanalga obuna bo'lish</NuxtLink
					>
					<p>
						Eslatma: Kanalga obuna bo'lgandan keyin ilovadan chiqib,
						qaytadan kiring.
					</p>
				</div>
			</div>
		</div> -->

		<div class="fixed top-1 right-1 z-50 flex justify-end p-5">
			<LucideRefreshCw :size="15" @click="login" />
		</div>
		<div class="h-[12rem] p-5">
			<p class="text-lg">Salom {{ user }}</p>
			<p class="text-3xl">Astronga xush kelibsiz!</p>
			<div class="flex items-center gap-2 flex-wrap">
				<p class="text-lg">ID: {{ miniApp.initDataUnsafe.user?.id }}</p>
				<span
					v-if="proStatusChecked && isPro"
					class="inline-flex items-center rounded-md border border-[#C9A34B] bg-[#111111] px-2.5 py-0.5 text-sm font-bold tracking-wide text-[#E8C66A]"
				>PRO</span>
			</div>
			<p class="text-lg">
				Balans:
				{{ new Intl.NumberFormat("uz-Uz").format(parseInt(balance)) }}
			</p>
		</div>
		<div
			class="h-[calc(100%-12rem)] flex flex-col gap-2 bg-background border-t rounded-t-3xl p-5"
		>
			<div class="bg-accent/30 rounded-md divide-y">
				<div
					class="flex justify-between p-3"
					@click="
						$router.push({
							name: 'subjects',
							query: { type: 'quiz' },
						})
					"
				>
					<div class="flex items-center gap-2">
						<LucideMessageCircleQuestion :size="20" />
						<p>Savol-javoblar</p>
					</div>
					<div class="flex items-center justify-center">
						<LucideChevronRight />
					</div>
				</div>
				<div
					class="flex justify-between p-3"
					@click="
						$router.push({
							name: 'subjects',
							query: { type: 'test' },
						})
					"
				>
					<div class="flex items-center gap-2">
						<LucideListCheck :size="20" />
						<p>Testlar</p>
					</div>
					<div class="flex items-center justify-center">
						<LucideChevronRight />
					</div>
				</div>
				<div
					class="relative flex justify-between p-3"
					@click="navigateTo({ name: 'files' })"
				>
					<div class="flex items-center gap-2">
						<LucideFile :size="20" />
						<p>Qo'llanmalar</p>
						<div v-if="newFile" class="absolute top-4 right-4">
							<div
								class="w-4 h-4 rounded-full animate-ping bg-red-500"
							></div>
						</div>
					</div>
					<div class="flex items-center justify-center">
						<LucideChevronRight />
					</div>
				</div>
				<!-- <div
					class="relative flex justify-between p-3"
					@click="navigateTo({ name: 'courses' })"
				>
					<div class="flex items-center gap-2">
						<LucideBookCheck :size="20" />
						<p>Onlayn kurslar</p>
						<div v-if="newFile" class="absolute top-4 right-4">
							<div
								class="w-4 h-4 rounded-full animate-ping bg-red-500"
							></div>
						</div>
					</div>
					<div class="flex items-center justify-center">
						<LucideChevronRight />
					</div>
				</div> -->
				<div
					class="flex justify-between p-3"
					@click="navigateTo({ name: 'payment' })"
				>
					<div class="flex items-center gap-2">
						<LucideWallet :size="20" />
						<p>Akkaunt ma'lumotlari</p>
					</div>
					<div class="flex items-center justify-center">
						<LucideChevronRight />
					</div>
				</div>

				<div class="flex justify-between p-3" @click="shareApp">
					<div class="flex items-center gap-2">
						<LucideShare :size="20" />
						<p>Ilovani ulashish</p>
					</div>
					<div class="flex items-center justify-center">
						<LucideChevronRight />
					</div>
				</div>
            </div>
			
			<div
				v-if="announcement"
				class="bg-orange-500/10 border border-orange-500 rounded-md p-3 flex items-center gap-2"
			>
				<div class="p-2">
					<LucideBell class="text-orange-500 animate-bounce" />
				</div>
				<div v-html="announcement"></div>
			</div>
		</div>
	</div>

	<!-- Faqat WebApp bosh sahifasida chiqadigan umumiy xabar. -->
	<div
		v-if="channelRecommendation && !isLoading"
		class="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-1"
		role="dialog"
		aria-modal="true"
		aria-labelledby="channel-recommendation-title"
	>
		<div class="w-full max-w-[360px] rounded-2xl bg-white p-3 text-black shadow-xl">
			<div class="flex items-center justify-between gap-3 pb-3">
				<div class="flex min-w-0 items-center gap-2">
					<svg
						width="18"
						height="20"
						viewBox="0 0 24 28"
						fill="none"
						aria-hidden="true"
						class="shrink-0"
					>
						<path
							d="M12 1C13.4 1 14.5 2.1 14.5 3.5V3.8C18.6 4.9 21.6 8.6 21.6 13V19.6L24 22.1V23H0V22.1L2.4 19.6V13C2.4 8.6 5.4 4.9 9.5 3.8V3.5C9.5 2.1 10.6 1 12 1Z"
							fill="#EF4444"
						/>
						<path d="M8.2 25H15.8C15.3 27 13.8 28 12 28C10.2 28 8.7 27 8.2 25Z" fill="#EF4444" />
					</svg>
					<span id="channel-recommendation-title" class="text-base font-bold">
						Muhim xabar
					</span>
				</div>
				<button
					type="button"
					class="flex h-6 w-6 shrink-0 items-center justify-center text-lg leading-none text-gray-500"
					aria-label="Xabarni yopish"
					@click="dismissChannelRecommendation(false)"
				>
					×
				</button>
			</div>
			<div class="border-t border-gray-200 pt-3">
				<p class="whitespace-pre-wrap break-words text-sm leading-6">
					{{ channelRecommendation.content }}
				</p>
				<button
					type="button"
					class="mt-3 flex h-[46px] w-full items-center justify-center gap-2 rounded-lg bg-[#229ED9] text-sm font-semibold text-white"
					@click="dismissChannelRecommendation(true)"
				>
					<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
						<path d="M21.6 3.4L2.8 10.7C1.5 11.2 1.5 11.9 2.6 12.2L7.5 13.7L18.9 6.5C19.4 6.2 19.9 6.4 19.5 6.8L10.3 15.1L10 19.9C10.5 19.9 10.7 19.7 11 19.4L13.4 17.1L18.4 20.8C19.3 21.3 20 21 20.2 20L23.3 5C23.6 3.7 22.8 3 21.6 3.4Z" />
					</svg>
					Postni o‘qish
				</button>
			</div>
		</div>
	</div>
</template>
