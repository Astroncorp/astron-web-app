<script setup lang="ts">
import {
	LucideChevronLeft,
	LucideChevronRight,
	LucideShoppingCart,
} from "lucide-vue-next";

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
const subjectsStore = useSubjectsStore();

const { token, balance } = storeToRefs(userStore);
const { subjects } = storeToRefs(subjectsStore);

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

const buyKlass = async (klass: IClass) => {
	await $fetch("https://astrontest.uz/mobile-api/api/uz/buy-class", {
		method: "POST",
		body: JSON.stringify({
			token: token.value,
			class_id: klass.classes_id,
		}),
	});
	getClassess();
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
	<div class="h-screen w-full">
		<div
			class="sticky top-0 z-50 bg-background flex items-center gap-2 h-[3rem] p-2 border-b"
		>
			<div class="border rounded-full p-1" @click="router.back()">
				<LucideChevronLeft />
			</div>
			<p>Sinflar</p>
		</div>
		<div class="h-[calc(100%-3rem)] flex flex-col gap-2 p-5">
			<br />
			<div class="bg-accent/30 rounded-md divide-y">
				<div v-for="klass in classes" class="flex justify-between p-2">
					<div class="flex items-center gap-2">
						<p class="">{{ klass.classes_name }}</p>
					</div>
					<div
						class="flex items-center justify-center"
						v-if="$route.query.type === 'test'"
					>
						<LucideChevronRight
							v-if="klass.purchased"
							@click="
								navigateTo({
									name: 'subjects-subjectid-classid',
									params: {
										subjectid: klass.subject_id,
										classid: klass.classes_id,
									},
									query: $route.query,
								})
							"
						/>
						<Dialog v-else>
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
						</Dialog>
					</div>
					<div v-else>
						<LucideChevronRight
							@click="
								navigateTo({
									name: 'subjects-subjectid-classid',
									params: {
										subjectid: klass.subject_id,
										classid: klass.classes_id,
									},
									query: $route.query,
								})
							"
						/>
					</div>
				</div>
			</div>
			<br />
		</div>
	</div>
</template>
