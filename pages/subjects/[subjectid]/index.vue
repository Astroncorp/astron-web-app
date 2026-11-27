<script setup lang="ts">
import { LucideChevronLeft, LucideChevronRight } from "lucide-vue-next";

interface IClass {
	classes_id: string;
	subject_id: string;
	classes_name: string;
	classes_status: string;
	purchased: boolean;
	price: number;
}

const route = useRoute();
const router = useRouter();

const userStore = useUserStore();

const { token, proPermissions } = storeToRefs(userStore);
const showProReminder = ref(false);

const openMixedSubjectTest = () => {
	if (!proPermissions.value.access_mixedsubject_test) {
		showProReminder.value = true;
		return;
	}

	navigateTo({
		name: "subjects-subjectid-mixedsubject",
		params: { subjectid: route.params.subjectid },
		query: route.query,
	});
};

const isLoading = ref(true);
const classes = ref<IClass[]>([]);

const getClassess = async () => {
	isLoading.value = true;
	let response = await $fetch<IClass[]>(
		"https://astrontest.uz/mobile-api/api/uz/classesuz?lang=uz",
		{
			method: "POST",
			body: JSON.stringify({
				token: token.value,
				subjectid: route.params.subjectid,
			}),
		},
	);

	classes.value = response;
	isLoading.value = true;
};

definePageMeta({
	middleware: ["is-telegram", "get-subjects"],
});

onMounted(() => {
	getClassess();
	isLoading.value = false;
});
</script>

<template>
	<div class="h-screen w-full flex flex-col">
		<div
			class="sticky top-0 z-50 bg-background flex items-center gap-2 h-[3rem] p-2 border-b"
		>
			<div class="border rounded-full p-1" @click="router.back()">
				<LucideChevronLeft />
			</div>
			<p>Sinflar</p>
		</div>
		<div class="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2 p-5">
			<br />
			<div class="bg-accent/30 rounded-md divide-y">
				<div v-for="klass in classes" class="flex justify-between p-2 cursor-pointer"
					@click="navigateTo({ name: 'subjects-subjectid-classid', params: { subjectid: klass.subject_id, classid: klass.classes_id }, query: $route.query })">
					<div class="flex items-center gap-2">
						<p class="">{{ klass.classes_name }}</p>
					</div>
					<div
						class="flex items-center justify-center"
						v-if="$route.query.type === 'test'"
					>
						<LucideChevronRight
							
						/>
						<!-- <Dialog v-else>
							<DialogTrigger>
								<Button
									size="xs"
									:class="
										klass.price > parseInt(balance)
											? 'bg-red-500'
											: 'bg-green-500'
									"
								>
									<LucideShoppingCart />
									<span>{{
										new Intl.NumberFormat("uz-UZ").format(
											klass.price,
										)
									}}</span>
								</Button>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Eslatma</DialogTitle>
									<DialogDescription></DialogDescription>
								</DialogHeader>
								<p
									class="text-center"
									v-if="parseInt(balance) >= klass.price"
								>
									<span class="font-bold"
										>"{{ klass.classes_name }}"</span
									>
									ni ochish uchun bir martalik to'lov qiling.
									<br />
									<span
										>To'lov summasi:
										{{
											new Intl.NumberFormat(
												"uz-UZ",
											).format(klass.price)
										}}
										so'm</span
									>
								</p>
								<p class="text-center" v-else>
									Balansingizda yetarli mablag' mavjud emas.
									Hisobingizni to'ldiring. <br />
									<span>
										Darslikni ochish uchun bir martalik
										to'lov summasi:
										{{
											new Intl.NumberFormat(
												"uz-UZ",
											).format(klass.price)
										}}
										so'm.
									</span>
								</p>
								<DialogFooter class="flex-row-reverse gap-2">
									<DialogClose>
										<Button
											v-if="
												parseInt(balance) >= klass.price
											"
											@click="buyKlass(klass)"
											>Balansdan yechish</Button
										>
									</DialogClose>
								</DialogFooter>
							</DialogContent>
						</Dialog> -->
					</div>
					<div v-else>
						<LucideChevronRight
							
						/>
					</div>
				</div>
			</div>
			<br />
		</div>
		<div
			v-if="$route.query.type === 'test'"
			class="shrink-0 bg-background flex items-center justify-center gap-2 h-[3rem] p-2 border-t"
		>
			<Button
				variant="outline"
				@click="openMixedSubjectTest"
			>
				<p>Nazorat testi (Fan bo‘yicha)</p>
				<LucideChevronRight class="h-4 w-4" />
			</Button>
		</div>
		<Dialog v-model:open="showProReminder">
			<DialogContent class="w-[calc(100%-96px)] max-w-sm rounded-none bg-white p-5 text-black">
				<DialogHeader>
					<DialogTitle class="text-center text-base font-semibold text-black">Eslatma</DialogTitle>
					<DialogDescription class="sr-only">PRO obunasi haqida eslatma</DialogDescription>
				</DialogHeader>
				<div class="space-y-4 text-center text-base leading-relaxed">
					<p>Ushbu funksiyadan foydalanish uchun "PRO" statusini faollashtiring.</p>
					<p class="italic">"PRO" obunasi oyiga - 25 000 so‘m</p>
					<p class="italic">Faollashtirish uchun adminga murojaat qiling</p>
				</div>
			</DialogContent>
		</Dialog>
	</div>
</template>
