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

type ModalType = "insufficient" | "purchase" | null;

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const { token, balance } = storeToRefs(userStore);

const classes = ref<IClass[]>([]);
const selectedClass = ref<IClass | null>(null);
const modalType = ref<ModalType>(null);
const isLoading = ref(true);
const isPurchasing = ref(false);
const purchaseError = ref("");

/*
 * Xariddan keyin sahifani qayta ochmasdan ranglarni yangilash uchun
 * lokal balans ishlatiladi.
 */
const currentBalance = ref(Number(balance.value) || 0);

watch(balance, (value) => {
	currentBalance.value = Number(value) || 0;
});

const formatPrice = (value: number | string) =>
	Number(value || 0).toLocaleString("ru-RU");

const hasEnoughBalance = (klass: IClass) =>
	currentBalance.value >= Number(klass.price);

const getClasses = async () => {
	isLoading.value = true;

	try {
		const response = await $fetch<IClass[]>(
			"https://astrontest.uz/mobile-api/api/uz/classesuz?lang=uz",
			{
				method: "POST",
				body: {
					token: token.value,
					subjectid: route.params.subjectid,
				},
			},
		);

		classes.value = Array.isArray(response) ? response : [];
	} catch (error) {
		console.error("Sinflarni olishda xatolik:", error);
		classes.value = [];
	} finally {
		isLoading.value = false;
	}
};

const openClass = (klass: IClass) => {
	navigateTo({
		name: "subjects-subjectid-classid",
		params: {
			subjectid: klass.subject_id,
			classid: klass.classes_id,
		},
		query: route.query,
	});
};

const openPurchaseModal = (klass: IClass) => {
	selectedClass.value = klass;
	purchaseError.value = "";
	modalType.value = hasEnoughBalance(klass)
		? "purchase"
		: "insufficient";
};

const closeModal = () => {
	if (isPurchasing.value) return;

	modalType.value = null;
	selectedClass.value = null;
	purchaseError.value = "";
};

const buyClass = async () => {
	const klass = selectedClass.value;

	if (!klass || isPurchasing.value) return;

	const price = Number(klass.price);

	/*
	 * Oyna ochilganidan keyin balans o‘zgargan bo‘lishi mumkin.
	 */
	if (currentBalance.value < price) {
		modalType.value = "insufficient";
		return;
	}

	isPurchasing.value = true;
	purchaseError.value = "";

	try {
		const response = await $fetch<Record<string, unknown>>(
			"https://astrontest.uz/mobile-api/api/uz/buy-class",
			{
				method: "POST",
				body: {
					token: token.value,
					class_id: klass.classes_id,
				},
			},
		);

		/*
		 * API yangi balansni qaytarsa undan foydalaniladi.
		 * Qaytarmasa, xarid summasi lokal balansdan ayriladi.
		 */
		const apiBalance = Number(
			response?.new_balance ?? response?.balance,
		);

		currentBalance.value = Number.isFinite(apiBalance)
			? apiBalance
			: Math.max(0, currentBalance.value - price);

		const purchasedClass = classes.value.find(
			(item) => item.classes_id === klass.classes_id,
		);

		if (purchasedClass) {
			purchasedClass.purchased = true;
		}

		modalType.value = null;
		selectedClass.value = null;

		/*
		 * purchased holatini backenddan qayta tasdiqlash.
		 */
		await getClasses();
	} catch (error: any) {
		console.error("Xarid qilishda xatolik:", error);

		purchaseError.value =
			error?.data?.message ||
			error?.message ||
			"Xaridni amalga oshirishda xatolik yuz berdi.";
	} finally {
		isPurchasing.value = false;
	}
};

definePageMeta({
	middleware: ["is-telegram", "get-subjects"],
});

onMounted(getClasses);
</script>

<template>
	<div class="min-h-screen w-full bg-background">
		<header
			class="sticky top-0 z-50 flex h-12 items-center gap-2 border-b bg-background p-2"
		>
			<button
				type="button"
				class="rounded-full border p-1"
				aria-label="Orqaga"
				@click="router.back()"
			>
				<LucideChevronLeft />
			</button>

			<p>Sinflar</p>
		</header>

		<main class="p-5">
			<div
				v-if="isLoading"
				class="py-10 text-center text-sm text-muted-foreground"
			>
				Yuklanmoqda...
			</div>

			<div
				v-else-if="!classes.length"
				class="py-10 text-center text-sm text-muted-foreground"
			>
				Sinflar topilmadi.
			</div>

			<div
				v-else
				class="divide-y overflow-hidden rounded-md bg-accent/30"
			>
				<div
					v-for="klass in classes"
					:key="klass.classes_id"
					class="flex min-h-[54px] items-center justify-between gap-3 p-2"
				>
					<p class="min-w-0 flex-1">
						{{ klass.classes_name }}
					</p>

					<!-- Testdan boshqa bo‘lim yoki oldin sotib olingan sinf -->
					<button
						v-if="
							$route.query.type !== 'test' ||
							klass.purchased
						"
						type="button"
						class="shrink-0 p-1"
						aria-label="Sinfni ochish"
						@click="openClass(klass)"
					>
						<LucideChevronRight />
					</button>

					<!-- Sotib olinmagan sinf -->
					<button
						v-else
						type="button"
						class="flex min-w-[104px] shrink-0 items-center justify-center gap-2 rounded-md px-3 py-2 font-semibold text-white shadow-sm transition active:scale-95"
						:class="
							hasEnoughBalance(klass)
								? 'bg-emerald-500 hover:bg-emerald-600'
								: 'bg-red-500 hover:bg-red-600'
						"
						@click="openPurchaseModal(klass)"
					>
						<LucideShoppingCart :size="19" />

						<span>
							{{ formatPrice(klass.price) }}
						</span>
					</button>
				</div>
			</div>
		</main>

		<!-- Eslatma oynasi -->
		<Teleport to="body">
			<div
				v-if="modalType && selectedClass"
				class="fixed inset-0 z-[200] flex items-center justify-center bg-black/80"
				@click.self="closeModal"
			>
				<div
					class="relative w-full max-w-[570px] border-y border-white/15 bg-black px-6 py-8 text-white shadow-2xl"
				>
					<button
						type="button"
						class="absolute right-5 top-3 text-3xl font-light text-white/70 hover:text-white"
						aria-label="Yopish"
						:disabled="isPurchasing"
						@click="closeModal"
					>
						×
					</button>

					<h2 class="mb-7 text-center text-2xl font-bold">
						Eslatma
					</h2>

					<!-- Qizil savatcha eslatmasi -->
					<div
						v-if="modalType === 'insufficient'"
						class="text-center text-xl leading-relaxed"
					>
						<p>
							Balansingizda yetarli mablag‘ mavjud emas.
							<br />
							Hisobingizni to‘ldiring.
							<br />
							Darslikni ochish uchun bir martalik to‘lov
							<br />
							summasi:
							{{ formatPrice(selectedClass.price) }} so‘m.
						</p>
					</div>

					<!-- Yashil savatcha eslatmasi -->
					<div v-else class="text-center">
						<p class="text-lg leading-relaxed">
							<strong>
								&quot;{{ selectedClass.classes_name }}&quot;
							</strong>
							ni
							<br />
							ochish uchun bir martalik to‘lov qiling.
							<br />
							To‘lov summasi:
							{{ formatPrice(selectedClass.price) }} so‘m
						</p>

						<p
							v-if="purchaseError"
							class="mt-4 text-sm text-red-400"
						>
							{{ purchaseError }}
						</p>

						<div class="mt-7 flex justify-end">
							<button
								type="button"
								class="min-w-[205px] rounded-md bg-white px-5 py-3 font-medium text-black shadow disabled:opacity-60"
								:disabled="isPurchasing"
								@click="buyClass"
							>
								{{
									isPurchasing
										? "Yechilmoqda..."
										: "Balansdan yechish"
								}}
							</button>
						</div>
					</div>
				</div>
			</div>
		</Teleport>
	</div>
</template>