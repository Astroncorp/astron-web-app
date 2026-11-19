<script setup lang="ts">
import { LucideCheck, LucideChevronLeft, LucideChevronRight } from "lucide-vue-next";

interface IMavzu {
    mavzu_id: string;
    fan_id: string;
    sinf_id: string;
    mavzu_nomi: string;
    mavzu_status: string;
}

const route = useRoute();
const router = useRouter();

const userStore = useUserStore();
const subjectsStore = useSubjectsStore();

const { token, proPermissions, isPro, proStatusChecked } = storeToRefs(userStore);
const showProReminder = ref(false);

// Faqat PRO foydalanuvchi mavzulashgan test rejimida 1-5 mavzuni tanlay oladi.
const selectedThemeIds = ref<string[]>([]);
const canSelectThemes = computed(
    () => route.query.type === "test" && proStatusChecked.value && isPro.value,
);

const toggleThemeSelection = (themeId: string) => {
    if (!canSelectThemes.value) return;

    const id = String(themeId);
    if (selectedThemeIds.value.includes(id)) {
        selectedThemeIds.value = selectedThemeIds.value.filter((item) => item !== id);
    } else if (selectedThemeIds.value.length < 5) {
        selectedThemeIds.value.push(id);
    }
    // 6-mavzuni belgilash urinishida hech narsa o'zgarmaydi.
};

const openSelectedMixedTest = () => {
    if (!canSelectThemes.value || selectedThemesInOrder.value.length === 0) return;

    if (!proPermissions.value.access_mixed_test) {
        showProReminder.value = true;
        return;
    }

    navigateTo({
        // Keyingi bosqichda pages/subjects/[subjectid]/[classid]/mixedfive.vue qo'shiladi.
        name: "subjects-subjectid-classid-mixedfive",
        params: {
            subjectid: route.params.subjectid,
            classid: route.params.classid,
        },
        query: {
            themeids: selectedThemesInOrder.value.map((theme) => theme.mavzu_id).join(","),
        },
    });
};

// PRO muddati tugasa yoki sahifa test rejimidan chiqsa eski tanlovlar qolmasin.
watch(canSelectThemes, (allowed) => {
    if (!allowed) selectedThemeIds.value = [];
});

const openMixedTest = () => {
    if (!proPermissions.value.access_mixed_test) {
        showProReminder.value = true;
        return;
    }

    navigateTo({
        name: "subjects-subjectid-classid-mixed",
        params: {
            subjectid: route.params.subjectid,
            classid: route.params.classid,
        },
    });
};
const { subjects } = storeToRefs(subjectsStore);

const isLoading = ref(true);
const themes = ref<IMavzu[]>([]);
// Natijaga mavzular foydalanuvchi belgilagan navbatda emas, ro'yxat tartibida o'tadi.
const selectedThemesInOrder = computed(() =>
    themes.value.filter((theme) =>
        selectedThemeIds.value.includes(String(theme.mavzu_id)),
    ),
);

const getClassess = async () => {
    isLoading.value = true;
    selectedThemeIds.value = [];
    let response = await $fetch<IMavzu[]>(
        "https://astrontest.uz/mobile-api/api/uz/testthemeuz?lang=uz",
        {
            method: "POST",
            body: JSON.stringify({
                token: token.value,
                subjectid: route.params.subjectid,
                classesid: route.params.classid,
            }),
        },
    );

    themes.value = response;
    };

definePageMeta({
    middleware: [
        "get-subjects",
        // "is-telegram",
    ],
});

onMounted(() => {
    getClassess();
    isLoading.value = false;
});
</script>

<template>
    <div class="h-screen w-full" :class="{ 'flex flex-col': $route.query.type === 'test' }">
        <div
            class="bg-background flex items-center gap-2 h-[3rem] shrink-0 p-2 border-b"
        >
            <div class="border rounded-full p-1" @click="router.back()">
                <LucideChevronLeft />
            </div>
            <p>Mavzular</p>
        </div>
        <div
            class="flex flex-col gap-2 px-5"
            :class="$route.query.type === 'test' ? 'flex-1 min-h-0' : 'h-[calc(100%-6rem)]'"
        >
            <ScrollArea class="h-full">
                <br />
                <div class="bg-accent/30 rounded-md divide-y">
                    <div
                        v-for="theme in themes"
                        :key="theme.mavzu_id"
                        class="flex items-center justify-between gap-2 p-2 cursor-pointer"
                        @click="
                            () => {
                                $route.query.type === 'quiz'
                                    ? navigateTo({
                                          name: 'subjects-subjectid-classid-themeid-quiz',
                                          params: {
                                              subjectid: theme.fan_id,
                                              classid: theme.sinf_id,
                                              themeid: theme.mavzu_id,
                                          },
                                      })
                                    : navigateTo({
                                          name: 'subjects-subjectid-classid-themeid-test',
                                          params: {
                                              subjectid: theme.fan_id,
                                              classid: theme.sinf_id,
                                              themeid: theme.mavzu_id,
                                          },
                                      });
                            }
                        "
                    >
                        <div class="flex items-center gap-2 min-w-0">
                            <button
                                v-if="canSelectThemes"
                                type="button"
                                role="checkbox"
                                :aria-checked="selectedThemeIds.includes(String(theme.mavzu_id))"
                                :aria-label="`Tanlash: ${theme.mavzu_nomi}`"
                                class="w-[18px] h-[18px] shrink-0 border rounded-[2px] flex items-center justify-center"
                                :class="selectedThemeIds.includes(String(theme.mavzu_id)) ? 'border-green-600' : 'border-foreground'"
                                @click.stop="toggleThemeSelection(theme.mavzu_id)"
                            >
                                <LucideCheck
                                    v-if="selectedThemeIds.includes(String(theme.mavzu_id))"
                                    class="w-4 h-4 text-green-600"
                                />
                            </button>
                            <p>{{ theme.mavzu_nomi }}</p>
                        </div>
                        <div class="flex items-center justify-center shrink-0">
                            <LucideChevronRight />
                        </div>
                    </div>
                </div>
                <br />
            </ScrollArea>
        </div>
        <div
            v-if="$route.query.type === 'test'"
            class="bg-background shrink-0 flex flex-col items-center justify-center gap-2 p-2 border-t"
        >
            <Button
                v-if="canSelectThemes && selectedThemesInOrder.length > 0"
                variant="outline"
                class="whitespace-normal h-auto min-h-9 text-center"
                @click="openSelectedMixedTest"
            >
                Nazorat testi (Tanlangan mavzular bo'yicha)
            </Button>
            <Button
                variant="outline"
                @click="openMixedTest"
            >
                <div class="flex items-center gap-2">
                    <p class="">Nazorat testi (Darslik bo'yicha)</p>
                </div>
                <div class="flex items-center justify-center">
                    <LucideChevronRight />
                </div>
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
