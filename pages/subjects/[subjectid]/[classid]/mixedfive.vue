<script setup lang="ts">
import { LucideChevronLeft } from "lucide-vue-next";

interface IVariant {
    variant: string;
    var_id: string;
    is_right: string;
}

interface IQuestion {
    savol_id: string;
    savol_nomi: string;
    mavzu_id: string;
    test_file: string;
    variant: IVariant[];
    selected: string;
    is_selected: boolean;
    is_solved: boolean;
}

interface IClass {
    classes_id: string;
    subject_id: string;
    classes_name: string;
}

interface IMavzu {
    mavzu_id: string;
    fan_id: string;
    sinf_id: string;
    mavzu_nomi: string;
}

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const { token, isPro, proStatusChecked, proPermissions } = storeToRefs(userStore);

const questions = ref<IQuestion[]>([]);
const className = ref("");
const selectedThemeNames = ref<string[]>([]);
const isLoading = ref(false);
const loadError = ref("");

const hasProAccess = computed(
    () => proStatusChecked.value && isPro.value && proPermissions.value.access_mixed_test,
);

// Mavzular ro'yxatidan kelgan 1-5 IDni tekshiramiz; token URLga kiritilmaydi.
const getSelectedThemeIds = (): number[] => {
    const value = route.query.themeids;
    if (typeof value !== "string" || !value.trim()) return [];

    const parts = value.split(",");
    if (parts.length < 1 || parts.length > 5) return [];
    if (parts.some((part) => !/^[1-9]\d*$/.test(part))) return [];

    const ids = parts.map(Number);
    if (ids.some((id) => !Number.isSafeInteger(id))) return [];
    if (new Set(ids).size !== ids.length) return [];
    return ids;
};

// PHP javobi JSON qator yoki tayyor massiv bo'lishi mumkin.
const asArray = <T,>(response: unknown): T[] => {
    let data = response;
    if (typeof data === "string") {
        try {
            data = JSON.parse(data);
        } catch {
            return [];
        }
    }
    return Array.isArray(data) ? (data as T[]) : [];
};

const answerQuestion = (question: IQuestion, value: unknown) => {
    if (question.is_selected) return;

    const answer = question.variant.find((item) => item.var_id === String(value));
    if (!answer) return;

    question.selected = answer.var_id;
    question.is_selected = true;
    question.is_solved = answer.is_right === "1";
};

// Barcha hisob-kitoblar faqat foydalanuvchi qurilmasida; serverga yozilmaydi.
const calculate = computed(() => {
    const all = questions.value.length;
    const selected = questions.value.filter((question) => question.is_selected).length;
    const correct = questions.value.filter((question) => question.is_solved).length;
    const percent = selected > 0 ? Math.ceil((correct / selected) * 100) : 0;
    return { all, selected, correct, percent };
});

const resultGrade = computed(() => {
    if (calculate.value.percent < 60) return "Qoniqarsiz";
    if (calculate.value.percent < 80) return "Qoniqarli";
    if (calculate.value.percent < 99) return "Yaxshi";
    return "A'lo";
});

const resultGradeColor = computed(() => {
    if (calculate.value.percent < 60) return "bg-red-500";
    if (calculate.value.percent < 80) return "bg-orange-500";
    if (calculate.value.percent < 99) return "bg-green-300";
    return "bg-green-500";
});

let requestSequence = 0;

const loadSelectedMixedTest = async () => {
    const sequence = ++requestSequence;
    questions.value = [];
    className.value = "";
    selectedThemeNames.value = [];
    loadError.value = "";

    if (!hasProAccess.value) {
        isLoading.value = false;
        return;
    }

    const themeIds = getSelectedThemeIds();
    if (themeIds.length === 0) {
        isLoading.value = false;
        loadError.value = "Mavzular noto'g'ri tanlangan. Orqaga qaytib, 1-5 ta mavzuni belgilang.";
        return;
    }

    isLoading.value = true;

    try {
        const [questionsResponse, classesResponse, themesResponse] = await Promise.all([
            $fetch<unknown>("https://astrontest.uz/mobile-api/api/testlaruzfive.php?lang=uz", {
                method: "POST",
                body: {
                    token: token.value,
                    subjectid: route.params.subjectid,
                    classid: route.params.classid,
                    themeid: themeIds,
                },
            }),
            $fetch<unknown>("https://astrontest.uz/mobile-api/api/uz/classesuz?lang=uz", {
                method: "POST",
                body: JSON.stringify({
                    token: token.value,
                    subjectid: route.params.subjectid,
                }),
                headers: { "Content-Type": "application/json" },
            }),
            $fetch<unknown>("https://astrontest.uz/mobile-api/api/uz/testthemeuz?lang=uz", {
                method: "POST",
                body: JSON.stringify({
                    token: token.value,
                    subjectid: route.params.subjectid,
                    classesid: route.params.classid,
                }),
                headers: { "Content-Type": "application/json" },
            }),
        ]);

        // Boshqa akkaunt yoki darslikka o'tilgan bo'lsa eski javobni ko'rsatmaymiz.
        if (sequence !== requestSequence || !hasProAccess.value) return;

        const classes = asArray<IClass>(classesResponse);
        const themes = asArray<IMavzu>(themesResponse);
        const currentClass = classes.find(
            (item) => String(item.classes_id) === String(route.params.classid),
        );
        const selectedThemes = themes
            .filter((theme) => themeIds.includes(Number(theme.mavzu_id)))
            .sort((a, b) => Number(a.mavzu_id) - Number(b.mavzu_id));

        if (!currentClass || selectedThemes.length !== themeIds.length) {
            throw new Error("Darslik yoki tanlangan mavzular ma'lumotlari topilmadi.");
        }

        const fetchedQuestions = asArray<IQuestion>(questionsResponse);
        // Savollar chegarasi PHPda belgilangan; bu yerda ham ko'pi bilan 30 ta ko'rsatiladi.
        questions.value = fetchedQuestions.slice(0, 30).map((question) => ({
            ...question,
            savol_id: String(question.savol_id),
            mavzu_id: String(question.mavzu_id),
            test_file: question.test_file ?? "",
            variant: Array.isArray(question.variant)
                ? question.variant.map((variant) => ({
                    variant: variant.variant,
                    var_id: String(variant.var_id),
                    is_right: String(variant.is_right),
                }))
                : [],
            selected: "",
            is_selected: false,
            is_solved: false,
        }));

        className.value = currentClass.classes_name;
        // Hech qanday qo'shimcha raqam emas, mavzu nomlari aynan bazadagidek chiqadi.
        selectedThemeNames.value = selectedThemes.map((theme) => theme.mavzu_nomi);
    } catch (error) {
        if (sequence !== requestSequence) return;
        console.error("Tanlangan mavzular bo'yicha testni yuklashda xatolik:", error);
        loadError.value = "Testni yuklab bo'lmadi. Internet aloqasini tekshirib, qayta urinib ko'ring.";
    } finally {
        if (sequence === requestSequence) isLoading.value = false;
    }
};

// PRO tekshiruvi tugagandan keyingina PHPdan savollar so'raladi.
watch(
    [
        proStatusChecked,
        isPro,
        token,
        () => proPermissions.value.access_mixed_test,
        () => route.params.subjectid,
        () => route.params.classid,
        () => route.query.themeids,
    ],
    () => {
        if (!import.meta.client) return;
        if (!hasProAccess.value) {
            ++requestSequence;
            questions.value = [];
            isLoading.value = false;
            return;
        }
        void loadSelectedMixedTest();
    },
    { immediate: true },
);

definePageMeta({
    middleware: ["is-telegram", "get-subjects"],
});
</script>

<template>
    <div class="h-screen w-full flex flex-col">
        <div class="bg-background flex items-center justify-between gap-2 h-[3rem] shrink-0 p-2 border-b">
            <div class="flex items-center gap-1">
                <div class="border rounded-full p-1" @click="router.back()">
                    <LucideChevronLeft />
                </div>
                <p>Nazorat testi</p>
            </div>
            <Drawer v-if="hasProAccess && !isLoading && !loadError && questions.length > 0">
                <DrawerTrigger as-child>
                    <Button size="sm">Natija</Button>
                </DrawerTrigger>
                <DrawerContent class="h-3/4 p-5 overflow-hidden">
                    <DrawerHeader class="shrink-0">
                        <DrawerTitle></DrawerTitle>
                        <DrawerDescription></DrawerDescription>
                    </DrawerHeader>
                    <div class="min-h-0 w-full flex-1 overflow-y-auto overscroll-contain pb-4">
    <div class="grid items-center justify-center gap-2 w-full">
                        <p class="w-full text-end text-muted-foreground">
                            {{ new Date().toLocaleDateString("en-GB") }}
                        </p>
                        <p class="w-full text-center text-base font-semibold leading-snug whitespace-normal break-words px-2">
                            {{ className }}
                        </p>
                        <div class="w-full flex flex-col gap-1 px-2">
                            <p
                                v-for="(themeName, index) in selectedThemeNames"
                                :key="index"
                                class="w-full text-center text-base font-normal leading-snug whitespace-normal break-words"
                            >
                                {{ themeName }}
                            </p>
                        </div>
                        <p class="w-full min-w-0 max-w-full text-center text-base font-normal leading-snug whitespace-normal break-words px-2">
                            Nazorat testi (Tanlangan mavzular bo‘yicha)
                        </p>
                        <div class="flex flex-col gap-1 items-center justify-center bg-accent/50 p-2 rounded-md">
                            <div class="flex items-center gap-1">
                                <p>Umumiy: {{ calculate.all }} ta</p>
                                <Separator class="h-8" orientation="vertical" />
                                <p>Belgilangan: {{ calculate.selected }} ta</p>
                            </div>
                            <div class="flex items-center gap-1">
                                <p>To'g'ri javob: {{ calculate.correct }} ta</p>
                                <Separator class="h-8" orientation="vertical" />
                                <p>Foiz: {{ calculate.percent }}%</p>
                            </div>
                        </div>
                        <p class="w-full font-bold text-center my-2 p-2 rounded-full" :class="resultGradeColor">
                            {{ resultGrade }}
                        </p>
                    </div>
                    </div>
                </DrawerContent>
            </Drawer>
        </div>

        <div class="flex-1 min-h-0 flex flex-col gap-2 px-5">
            <ScrollArea class="h-full">
                <div v-if="!proStatusChecked" class="py-8 text-center text-muted-foreground">
                    PRO status tekshirilmoqda...
                </div>
                <div v-else-if="!hasProAccess" class="py-8 text-center">
                    Ushbu nazorat testi faqat PRO foydalanuvchilari uchun mavjud.
                </div>
                <div v-else-if="isLoading" class="py-8 text-center text-muted-foreground">
                    Test yuklanmoqda...
                </div>
                <div v-else-if="loadError" class="py-8 flex flex-col items-center gap-4">
                    <p class="text-center">{{ loadError }}</p>
                    <Button variant="outline" @click="loadSelectedMixedTest">Qayta urinish</Button>
                </div>
                <div v-else-if="questions.length === 0" class="py-8 text-center text-muted-foreground">
                    Tanlangan mavzularda test savollari mavjud emas.
                </div>
                <div v-else class="flex flex-col gap-3 py-4">
                    <div
                        v-for="(test, index) in questions"
                        :key="test.savol_id"
                        class="bg-accent/30 rounded-md p-2"
                    >
                        <p class="text-lg">{{ index + 1 }}. {{ test.savol_nomi }}</p>
                        <div class="flex items-center justify-center">
                            <Dialog v-if="test.test_file && test.test_file !== 'empty'">
                                <DialogTrigger as-child>
                                    <img
                                        class="h-32"
                                        :src="`https://astrontest.uz/mypage/uploads/${test.test_file}`"
                                        alt="Savol rasmi"
                                    />
                                </DialogTrigger>
                                <DialogContent class="p-0">
                                    <img
                                        class="w-full h-full"
                                        :src="`https://astrontest.uz/mypage/uploads/${test.test_file}`"
                                        alt="Savol rasmi"
                                    />
                                </DialogContent>
                            </Dialog>
                        </div>
                        <RadioGroup
                            :name="`answer_${index + 1}`"
                            v-model="test.selected"
                            :disabled="test.is_selected"
                            @update:model-value="(value) => answerQuestion(test, value)"
                        >
                            <div
                                v-for="variant in test.variant"
                                :key="variant.var_id"
                                class="flex items-center space-x-2"
                            >
                                <RadioGroupItem
                                    :value="variant.var_id"
                                    :id="`answer_${index + 1}_${variant.var_id}`"
                                />
                                <Label :for="`answer_${index + 1}_${variant.var_id}`">
                                    <span v-if="variant.is_right === '1' && test.is_selected">✅</span>
                                    <span v-if="test.selected === variant.var_id && variant.is_right !== '1'">❌</span>
                                    {{ variant.variant }}
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>
                </div>
            </ScrollArea>
        </div>
    </div>
</template>
