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
} from "lucide-vue-next";
import { toast } from "vue-sonner";
import { useMiniApp } from "vue-tg";

const route = useRoute();
const miniApp = useMiniApp();

const userStore = useUserStore();
const { balance } = storeToRefs(userStore);

const newFile = ref(false);

const isLoading = ref(true);
const announcement = ref("");
const created = ref("");
const status = ref("");
const isWaiting = ref(true);

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

definePageMeta({
	middleware: ["is-telegram", "get-subjects"],
});

useSeoMeta({
	title: "Astron",
});

onMounted(async () => {
	login();
	isLoading.value = false;

	let response1 = await $fetch<{
		status: "success" | "error";
		code: string;
		data: string;
	}>(
		`https://bot.astron.uz/is-chat-member/?user_id=${miniApp.initDataUnsafe.user?.id}&chat_id=@tarix_repetitor_astron`,
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
						to="https://t.me/tarix_repetitor_astron"
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
			<p class="text-lg">ID: {{ miniApp.initDataUnsafe.user?.id }}</p>
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
</template>
