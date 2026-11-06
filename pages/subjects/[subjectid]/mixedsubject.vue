<script setup lang="ts">
import { LucideChevronLeft } from 'lucide-vue-next';



interface IVariant {
    variant: string;
    var_id: string;
    is_right: string;
}


interface IQuestion {
    savol_id: string;
    savol_nomi: string;
    variant: IVariant[];
    test_file: string;
    selected: string;
    is_selected: boolean;
    is_solved: boolean;
}

const route = useRoute();
const router = useRouter();

const userStore = useUserStore();
const subjectsStore = useSubjectsStore();

const { token } = storeToRefs(userStore);

const isLoading = ref(true);
const questions = ref<IQuestion[]>([]);
const subjectName = computed(() => {
    const subject = subjectsStore.subjects.find((item: any) =>
        String(item.subject_id) === String(route.params.subjectid)
    );
    return subject?.subject_name ?? "";
});
const loadError = ref("");


const YANDEX_RESULT_BLOCK_ID = "R-A-19395198-4";
const YANDEX_LOADER_SRC = "https://yandex.ru/ads/system/context.js";

const ensureYandexLoader = () => {
    if (typeof window === "undefined") return;

    const w = window as any;
    w.yaContextCb = w.yaContextCb || [];

    if (document.querySelector(`script[src="${YANDEX_LOADER_SRC}"]`)) return;

    const script = document.createElement("script");
    script.src = YANDEX_LOADER_SRC;
    script.async = true;
    document.head.appendChild(script);
};

const showResultAd = () => {
    if (typeof window === "undefined") return;

    try {
        ensureYandexLoader();

        const w = window as any;
        w.yaContextCb = w.yaContextCb || [];

        w.yaContextCb.push(() => {
            try {
                w.Ya.Context.AdvManager.render({
                    blockId: YANDEX_RESULT_BLOCK_ID,
                    type: "fullscreen",
                    platform: "touch",
                });
            } catch (error) {
                console.error("Yandex fullscreen reklamasini chaqirishda xatolik:", error);
            }
        });
    } catch (error) {
        console.error("Yandex reklama yuklagichida xatolik:", error);
    }
};


const getMixedTests = async () => {
    isLoading.value = true;
    loadError.value = "";
    try {
        const response = await $fetch<string | IQuestion[]>(
            "https://astrontest.uz/mobile-api/api/mixsubjecttestuz.php?lang=uz",
            {
                method: "POST",
                body: JSON.stringify({
                    token: token.value,
                    subjectid: route.params.subjectid,
                }),
                headers: { "Content-Type": "application/json" },
            }
        );
        const data = typeof response === "string" ? JSON.parse(response) : response;
        if (!Array.isArray(data)) throw new Error("Invalid API response");
        questions.value = data.map((test: IQuestion) => ({
            ...test,
            selected: "",
            is_selected: false,
            is_solved: false,
        }));
        if (!questions.value.length) loadError.value = "Bu fan bo‘yicha savollar topilmadi.";
    } catch (error) {
        console.error("Fan bo‘yicha nazorat testini yuklashda xatolik:", error);
        loadError.value = "Savollarni yuklab bo‘lmadi. Qaytadan urinib ko‘ring.";
    } finally {
        isLoading.value = false;
    }
};


const calculate = computed(() => {
    let all = questions.value.length;
    let selected = questions.value.filter((test) => test.is_selected).length;
    let correct = questions.value.filter(test => test.is_solved).length;
    let incorrect = all - correct;
    return { all, correct, incorrect, selected };
});


definePageMeta({
    middleware: [
        "is-telegram",
        "get-subjects",
    ],
});

onMounted(() => {
    getMixedTests();

});
</script>

<template>
    <div class="h-screen w-full">
        <div class="bg-background flex items-center justify-between gap-2 h-[3rem] p-2 border-b">
            <div class="flex items-center gap-1">
                <div class="border rounded-full p-1" @click="router.back()">
                    <LucideChevronLeft />
                </div>
                <p>Nazorat testi</p>
            </div>
            <div>
                <Drawer>
                    <DrawerTrigger as-child>
                        <Button size="sm" @click="showResultAd">Natija</Button>
                    </DrawerTrigger>
                    <DrawerContent class="h-3/4 p-5 overflow-y-auto">
                        <DrawerHeader>
                            <DrawerTitle></DrawerTitle>
                            <DrawerDescription></DrawerDescription>
                        </DrawerHeader>
                        <div class="grid items-center justify-center gap-2 w-full">
                            <p class="text-end text-muted-foreground">
                                {{ new Date().toLocaleDateString("en-GB").replace(/\//g, '/') }}
                            </p>
                            <p v-if="subjectName" class="w-full text-center text-base font-semibold leading-snug whitespace-normal break-words px-2">
                                {{ subjectName }}
                            </p>
                            <p class="w-full text-center text-base font-normal leading-snug whitespace-normal break-words px-2">
                                Nazorat testi (Fan bo‘yicha)
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
                                    <p>Foiz: {{ isNaN(Math.ceil((calculate.correct / calculate.selected) * 100)) ? 0
                                        : Math.ceil((calculate.correct / calculate.selected) * 100) }}%</p>
                                </div>
                            </div>
                            <p class="w-full font-bold text-center my-2 p-2 bg-red-500 rounded-full"
                                v-if="(isNaN(Math.ceil((calculate.correct / calculate.selected) * 100)) ? 0 : Math.ceil((calculate.correct / calculate.selected) * 100)) < 60">
                                Qoniqarsiz</p>
                            <p class="w-full font-bold text-center my-2 p-2 bg-orange-500 rounded-full"
                                v-else-if="Math.ceil((calculate.correct / calculate.selected) * 100) < 80">Qoniqarli
                            </p>
                            <p class="w-full font-bold text-center my-2 p-2 bg-green-300 rounded-full"
                                v-else-if="Math.ceil((calculate.correct / calculate.selected) * 100) < 99">Yaxshi
                            </p>
                            <p class="w-full font-bold text-center my-2 p-2 bg-green-500 rounded-full" v-else>A'lo</p>
                        </div>
                    </DrawerContent>
                </Drawer>
            </div>
        </div>
        <div class="h-[calc(100%-3rem)] flex flex-col gap-2 px-5">
            <ScrollArea class="h-full">
                <br>
                <p v-if="isLoading" class="text-center text-muted-foreground">Savollar yuklanmoqda...</p>
                <p v-else-if="loadError" class="text-center text-muted-foreground">{{ loadError }}</p>
                <div class="flex flex-col gap-3">
                    <div v-for="test, index in questions" :key="test.savol_id" class="bg-accent/30 rounded-md p-2">
                        <p class="text-lg">{{ index + 1 }}. {{ test.savol_nomi }}</p>
                        <div class="flex items-center justify-center">
                            <Dialog>
                                <DialogTrigger as-child>
                                    <img class="h-32" v-if="test.test_file && test.test_file !== 'empty'"
                                        :src="`https://astrontest.uz/mypage/uploads/${test.test_file}`" alt="">
                                </DialogTrigger>
                                <DialogContent class="p-0">
                                    <img class="w-full h-full" v-if="test.test_file && test.test_file !== 'empty'"
                                        :src="`https://astrontest.uz/mypage/uploads/${test.test_file}`" alt="">
                                </DialogContent>
                            </Dialog>
                        </div>
                        <RadioGroup :name="`answer_${index + 1}`" v-model="test.selected"
                            @update:model-value="() => { test.is_selected = true; test.is_solved = (test.variant.some(variant => variant.var_id === test.selected && String(variant.is_right) === '1')); }"
                            :disabled="test.is_selected">
                            <div v-for="variant in test.variant" :key="variant.var_id" class="flex items-center space-x-2">
                                <RadioGroupItem :value="variant.var_id" :id="`answer_${index + 1}_${variant.var_id}`" />
                                <Label :for="`answer_${index + 1}_${variant.var_id}`"><span
                                        v-if="String(variant.is_right) === '1' && test.selected">✅</span> <span
                                        v-if="test.selected === variant.var_id && String(variant.is_right) !== '1'">❌</span> {{
                                            variant.variant }}</Label>
                            </div>
                        </RadioGroup>
                    </div>
                </div>
                <br>
            </ScrollArea>
        </div>
    </div>
</template>
