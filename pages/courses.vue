<script setup lang="ts">
import { useMiniApp } from "vue-tg";
import {
	LucideChevronLeft,
	LucideChevronRight,
	LucideThumbsUp,
} from "lucide-vue-next";
import { buttonVariants } from "~/components/ui/button";

interface ICourse {
	handle: string;
	name: string;
	logo: string;
	likes: number;
	is_liked: boolean;
}

const router = useRouter();
const miniApp = useMiniApp();

const userStore = useUserStore();
let interval: NodeJS.Timeout;

const status = ref("");
const isWaiting = ref(true);
const isLoading = ref(true);
const courses = ref<ICourse[]>([]);

const orderedCourses = computed(() => {
	courses.value.sort((a, b) => b.likes - a.likes);
	return courses.value;
});

const login = async () => {
	// create a new user
	let response = await $fetch<{
		success: boolean;
		token: string;
		balance: string;
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
	userStore.setToken(response.token);
	userStore.setBalance(response.balance);
};

const likeOrDislike = async (course: ICourse) => {
	let response = await $fetch(
		"https://backend.astron.uz/api/v1/like_dislike/",
		{
			method: "post",
			body: JSON.stringify({
				user_id: miniApp.initDataUnsafe.user?.id,
				course_id: course.handle,
			}),
		},
	);

	courses.value.map((c) => {
		if (c.handle === course.handle) {
			c.likes = c.is_liked ? c.likes - 1 : c.likes + 1;
			c.is_liked = !c.is_liked;
		}
	});
};

const getCourses = async () => {
	let response = await $fetch<ICourse[]>(
		`https://backend.astron.uz/api/v1/course_channels/?user_id=${miniApp.initDataUnsafe.user?.id}`,
	);

	courses.value = response;
};

definePageMeta({
	middleware: ["is-telegram", "get-subjects"],
});

onMounted(async () => {
	getCourses();

	interval = setInterval(() => {
		getCourses();
	}, 3000);
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
});

onUnmounted(() => {
	clearInterval(interval);
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
						to="https://t.me/tarix_repetitor_astron"
						>Kanalga obuna bo'lish</NuxtLink
					>
					<p class="italic text-sm text-center">
						Eslatma: Kanalga obuna bo'lgandan keyin ilovadan chiqib,
						qaytadan kiring.
					</p>
				</div>
			</div>
		</div>

		<div class="flex items-center gap-2 h-[3rem] p-2 border-b">
			<div class="border rounded-full p-1" @click="router.back()">
				<LucideChevronLeft />
			</div>
			<p>Onlayn kurslar</p>
		</div>
		<div class="h-[calc(100%-3rem)] flex flex-col gap-2 p-5">
			<div class="bg-accent/30 rounded-md divide-y">
				<div
					v-for="course in orderedCourses"
					class="flex justify-between p-2"
				>
					<div class="flex items-center gap-2">
						<div>
							<img
								:src="course.logo"
								class="size-12 rounded-full border"
							/>
						</div>
						<div class="flex flex-col">
							<p class="text-lg">{{ course.name }}</p>
							<Button
								@click="likeOrDislike(course)"
								size="xs"
								:variant="course.is_liked ? 'liked' : 'ghost'"
								class="w-fit rounded-full"
							>
								<LucideThumbsUp />
								<span>{{ course.likes }}</span>
							</Button>
						</div>
					</div>
					<div
						@click="
							navigateTo(`https://t.me/${course.handle}`, {
								external: true,
								open: { target: '_blank' },
							})
						"
						class="flex items-center justify-center"
					>
						<LucideChevronRight />
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
