<script setup lang="ts">
import { LucideChevronLeft, LucideChevronRight } from "lucide-vue-next";
import { useMiniApp } from "vue-tg";
import { buttonVariants } from "~/components/ui/button";
import type { ISubject } from "~/types";

const route = useRoute();
const router = useRouter();
const miniApp = useMiniApp();

const subjectsStore = useSubjectsStore();

const { subjects } = storeToRefs(subjectsStore);

const status = ref("");
const isLoading = ref(true);
const isWaiting = ref(true);

const userStore = useUserStore();

const { token, balance } = storeToRefs(userStore);

// Desktop fullscreen faqat Testlar sahifasi ochilib, kanal obunasi tasdiqlangach.
// Mobil fullscreen app.vue ichida avvalgidek ishlashda davom etadi.
const showDesktopFullscreen = () => {
	if (
		route.name !== "subjects" ||
		route.query.type !== "test" ||
		!userStore.proStatusChecked ||
		userStore.isPro
	) return;

	const telegramUserId = miniApp.initDataUnsafe.user?.id;
	if (
		typeof telegramUserId !== "number" ||
		!Number.isSafeInteger(telegramUserId) ||
		telegramUserId <= 0
	) return;

	window.yaContextCb = window.yaContextCb || [];
	window.yaContextCb.push(() => {
		try {
			if (
				typeof Ya === "undefined" ||
				typeof Ya.Context?.AdvManager?.render !== "function" ||
				Ya.Context.AdvManager.getPlatform?.() !== "desktop"
			) return;

			console.info("[Astron Yandex Ads] desktop fullscreen request");
			Ya.Context.AdvManager.render({
				blockId: "R-A-19395198-6",
				type: "fullscreen",
				platform: "desktop",
				tgUid: String(telegramUserId),
				onError: (data: { type?: string; code?: string; text?: string }) => {
					console.warn("[Astron Yandex Ads] desktop onError:", data.type, data.code, data.text);
				},
				// Yandex talabi: onRender oxirgi parametr bo'lishi kerak.
				onRender: (data: { product?: string }) => {
					console.info("[Astron Yandex Ads] desktop onRender:", data.product);
				},
			});
		} catch (error) {
			console.error("[Astron Yandex Ads] desktop render xatosi:", error);
		}
	});
};

definePageMeta({
	middleware: ["is-telegram", "get-subjects"],
});

// Faqat Testlar bo'limidagi fan tanlanganda bitta kirishni hisoblash.
// So'rov xatosi fan sahifasiga o'tishga xalaqit bermaydi.
const openTestSubject = (subjectId: number) => {
	try {
		void fetch("https://backend.astron.uz/api/v1/subject-visit/", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ subject_id: Number(subjectId) }),
			keepalive: true,
		}).catch(() => {});
	} catch (_) {
		// Hisoblagich ishlamasa ham foydalanuvchi testga o'ta oladi.
	}
	navigateTo({
		name: "subjects-subjectid",
		params: { subjectid: subjectId },
		query: route.query,
	});
};

const getSubjects = async () => {
	const response = await $fetch<ISubject[]>(
		"https://astrontest.uz/mobile-api/api/uz/subjectuz?lang=uz",
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				token: token.value,
			}),
		},
	);

	subjectsStore.set(response);
};

onMounted(async () => {
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
	if (
		status.value === "member" ||
		status.value === "administrator" ||
		status.value === "creator"
	) {
		await nextTick();
		showDesktopFullscreen();
	}
});
</script>

<template>
	<div class="h-screen w-full">
		<div v-if="!isWaiting">
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
					<p class="italic text-sm text-center">
						Eslatma: Kanalga obuna bo'lgandan keyin ilovadan chiqib,
						qaytadan kiring.
					</p>
				</div>
			</div>
		</div>

		<div class="sticky top-0 flex items-center gap-2 h-[3rem] p-2 border-b">
			<div class="border rounded-full p-1" @click="router.back()">
				<LucideChevronLeft />
			</div>
			<p>Fanlar</p>
		</div>
		<div class="h-[calc(100%-3rem)] flex flex-col gap-2 p-5">
			<br />
			<div class="bg-accent/30 rounded-md divide-y">
				<div
					v-if="route.query.type === 'test'"
					v-for="subject in subjects.filter(
						(subject) => subject.t_status === 1,
					)"
					class="flex justify-between p-2"
					@click="openTestSubject(subject.subject_id)"
				>
					<div class="flex items-center gap-2">
						<p class="">{{ subject.subject_name }}</p>
					</div>
					<div class="flex items-center justify-center">
						<LucideChevronRight />
					</div>
				</div>
				<div
					v-else
					v-for="subject in subjects.filter(
						(subject) => subject.q_status === 1,
					)"
					class="flex justify-between p-2"
					@click="
						() => {
							subject.purchased || route.query.type === 'quiz'
								? navigateTo({
										name: 'subjects-subjectid',
										params: {
											subjectid: subject.subject_id,
										},
										query: $route.query,
									})
								: console.log('Sotib olinmagan');
						}
					"
				>
					<div class="flex items-center gap-2">
						<p class="">{{ subject.subject_name }}</p>
					</div>
					<div class="flex items-center justify-center">
						<LucideChevronRight />
					</div>
				</div>
			</div>
			<br />
		</div>
	</div>
</template>
