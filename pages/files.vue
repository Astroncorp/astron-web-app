<script setup lang="ts">
import { useMiniApp } from "vue-tg";
import {
	LucideChevronLeft,
	LucideDownload,
	LucideFile,
	LucideFiles,
	LucideLoader,
	LucideShoppingCart,
} from "lucide-vue-next";
import { buttonVariants } from "~/components/ui/button";

interface IFile {
	file_id: string;
	file_name: string;
	file_price: string;
	description: string;
	created_at: string;
}

interface IPurchasedFile {
	file_id: string;
	file_name: string;
	file_price: string;
	file_path: string;
	description: string;
	created_at: string;
}

const router = useRouter();
const miniApp = useMiniApp();

const userStore = useUserStore();

const { token, balance } = storeToRefs(userStore);

const status = ref("");
const open = ref(false);
const isWaiting = ref(true);
const isLoading = ref(true);
const files = ref<IFile[]>([]);
const purchasedFiles = ref<IPurchasedFile[]>([]);

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

const getFiles = async () => {
	let response = await $fetch<{ success: boolean; data: IFile[] }>(
		`https://astrontest.uz/mobile-api/api/uz/files/?token=${token.value}`,
	);

	if (response.success) {
		files.value = response.data;
	}
};

const getPurchasedFiles = async () => {
	let response = await $fetch<{ success: boolean; data: IPurchasedFile[] }>(
		`https://astrontest.uz/mobile-api/api/uz/purchased-files/?token=${token.value}`,
	);

	if (response.success) {
		purchasedFiles.value = response.data;
	}
};

const buyFile = async (file: IFile) => {
	isLoading.value = true;
	let response = await $fetch(
		"https://astrontest.uz/mobile-api/api/uz/buy-file/",
		{
			method: "POST",
			body: JSON.stringify({
				file_id: file.file_id,
				token: token.value,
			}),
		},
	);

	if (response) {
		open.value = false;
	}

	login();
	getFiles();
	getPurchasedFiles();
	isLoading.value = false;
};

definePageMeta({
	middleware: ["is-telegram", "get-subjects"],
});

onMounted(async () => {
	getFiles();
	getPurchasedFiles();
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
</script>

<template>
	<div class="h-screen w-full">
		<!-- Majburiy obuna -->
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
			<p>Fayllar</p>
		</div>
		<div class="h-[calc(100%-3rem)] flex flex-col gap-2 p-5">
			<Tabs default-value="files">
				<TabsList>
					<TabsTrigger value="files">
						<div class="flex items-center gap-1">
							<LucideFiles :size="15" />
							<p>Fayllar</p>
						</div>
					</TabsTrigger>
					<TabsTrigger value="files_purchased">
						<div class="flex items-center gap-1">
							<LucideShoppingCart :size="15" />
							<p>Sotib olinganlar</p>
						</div>
					</TabsTrigger>
				</TabsList>
				<TabsContent value="files">
					<div class="bg-accent/30 rounded-md divide-y">
						<div
							v-for="file in files.slice().reverse()"
							class="flex justify-between p-2"
						>
							<div class="flex items-center gap-2">
								<div>
									<LucideFile />
								</div>
								<div class="flex flex-col">
									<p class="">{{ file.file_name }}</p>
									<p class="text-muted-foreground text-xs">
										{{ file.description }}
									</p>
								</div>
							</div>
							<div class="flex items-center justify-center">
								<Dialog>
									<DialogTrigger
										v-if="
											parseInt(balance) >=
											parseInt(file.file_price)
										"
									>
										<Button size="sm" class="bg-green-500">
											<LucideShoppingCart />
											{{
												new Intl.NumberFormat(
													"uz-Uz",
												).format(
													parseInt(file.file_price),
												)
											}}
										</Button>
									</DialogTrigger>
									<DialogContent class="w-3/4">
										<DialogHeader>
											<DialogTitle
												>Fayl sotib olish</DialogTitle
											>
											<DialogDescription></DialogDescription>
										</DialogHeader>
										<p class="text-center">
											{{ file.file_name }} - ni sotib
											olasizmi?
										</p>
										<DialogFooter class="gap-2">
											<DialogClose>
												<Button
													:disabled="isLoading"
													@click="buyFile(file)"
												>
													<LucideLoader
														v-if="isLoading"
														class="animate-spin"
													/>
													Ha
												</Button>
											</DialogClose>
										</DialogFooter>
									</DialogContent>
								</Dialog>
								<Dialog>
									<DialogTrigger>
										<Button
											v-if="
												parseInt(balance) <
												parseInt(file.file_price)
											"
											size="sm"
											variant="destructive"
										>
											<LucideShoppingCart />
											{{
												new Intl.NumberFormat(
													"uz-Uz",
												).format(
													parseInt(file.file_price),
												)
											}}
										</Button>
									</DialogTrigger>
									<DialogContent class="w-3/4">
										<DialogHeader>
											<DialogTitle>Eslatma</DialogTitle>
											<DialogDescription
												>Hisobingizda mablag' yetarli
												emas.</DialogDescription
											>
										</DialogHeader>
										<p class="text-center">
											{{ file.file_name }} - ni sotib
											olish uchun hisobingizni to'ldiring.
										</p>
									</DialogContent>
								</Dialog>
							</div>
						</div>
					</div>
				</TabsContent>
				<TabsContent value="files_purchased">
					<div class="bg-accent/30 rounded-md divide-y">
						<div
							v-for="file in purchasedFiles"
							class="flex justify-between p-2"
						>
							<div class="flex items-center gap-2">
								<div>
									<LucideFile />
								</div>
								<div class="flex flex-col">
									<p>{{ file.file_name }}</p>
									<p class="text-muted-foreground text-xs">
										{{ file.description }}
									</p>
								</div>
							</div>
							<div class="flex items-center justify-center">
								<Button
									@click="
										navigateTo(
											'https://astrontest.uz/mypage/' +
												file.file_path,
											{
												external: true,
												open: { target: '_blank' },
											},
										)
									"
									size="sm"
								>
									<LucideDownload /> Yuklab olish
								</Button>
							</div>
						</div>
					</div>
				</TabsContent>
			</Tabs>
		</div>
	</div>
</template>
