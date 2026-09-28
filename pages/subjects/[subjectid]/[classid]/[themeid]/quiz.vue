<script setup lang="ts">
import { LucideChevronLeft, LucideChevronRight, LucideEye, LucideEyeClosed } from 'lucide-vue-next';


interface IQuiz {
    course_id: string;
    fan_id: string;
    sinf_id: string;
    mavzu_id: string;
    course_savol: string;
    course_javob: string;
}


const route = useRoute();
const router = useRouter();

const userStore = useUserStore();
const subjectsStore = useSubjectsStore();

const { token } = storeToRefs(userStore);

const isLoading = ref(true);
const quizzes = ref<IQuiz[]>([]);
const index = ref(0);
const open = ref(false);

const YANDEX_BANNER_BLOCK_ID = "R-A-19395198-5";
const YANDEX_BANNER_RENDER_TO = "yandex_rtb_R-A-19395198-5";

const loadYandexAds = () => {
    if (!import.meta.client) return;

    const renderBanner = () => {
        try {
            window.yaContextCb = window.yaContextCb || [];
            window.yaContextCb.push(() => {
                try {
                    Ya.Context.AdvManager.render({
                        blockId: YANDEX_BANNER_BLOCK_ID,
                        renderTo: YANDEX_BANNER_RENDER_TO,
                    });
                } catch (error) {
                    console.error("Yandex banner render xatoligi:", error);
                }
            });
        } catch (error) {
            console.error("Yandex banner xatoligi:", error);
        }
    };

    const existingScript = document.querySelector(
        'script[src="https://yandex.ru/ads/system/context.js"]'
    );

    if (existingScript) {
        renderBanner();
        return;
    }

    const script = document.createElement("script");
    script.src = "https://yandex.ru/ads/system/context.js";
    script.async = true;
    script.onload = renderBanner;
    script.onerror = () => console.error("Yandex reklama skripti yuklanmadi.");
    document.head.appendChild(script);
};



const getQuizzes = async () => {
    isLoading.value = true;
    let response = await $fetch<string>("https://astrontest.uz/mobile-api/api/uz/coursesuz/", {
        method: "POST",
        body: JSON.stringify({
            "token": token.value,
            "subjectid": route.params.subjectid,
            "classid": route.params.classid,
            "mavzuid": route.params.themeid,
        })
    });

    quizzes.value = JSON.parse(response);
    isLoading.value = true;
};


const getQuiz = computed(() => (index: number = 0) => {
    return quizzes.value[index];
});


definePageMeta({
    middleware: [
        "is-telegram",
        "get-subjects",
    ],
});

onMounted(() => {
    getQuizzes();
    isLoading.value = false;
    loadYandexAds();
});
</script>

<template>
    <div class="h-screen w-full">
        <div class="bg-background flex items-center gap-2 h-[3rem] p-2 border-b">
            <div class="border rounded-full p-1" @click="router.back()">
                <LucideChevronLeft />
            </div>
            <p>Savollar</p>
        </div>
        <div class="h-[calc(100%-3rem)] flex flex-col gap-2 px-5">
            <ScrollArea class="h-full">
                <div class="min-h-full flex flex-col">
                    <br>
                    <div class="bg-accent/30 rounded-md p-2">
                    <Collapsible v-if="getQuiz(index)" v-model:open="open">
                        <CollapsibleTrigger>
                            <div class="flex items-center gap-2 text-start text-lg">
                                <p>{{ getQuiz(index).course_savol }}</p>
                                <div>
                                    <LucideEye v-if="!open" :size="20" />
                                    <LucideEyeClosed v-else :size="20" />
                                </div>
                            </div>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                            <Separator />
                            <p class="text-green-500">{{ getQuiz(index).course_javob }}</p>
                        </CollapsibleContent>
                    </Collapsible>
                </div>
                <br>
                <div class="flex justify-between items-center">
                    <Button v-if="getQuiz(index - 1)" @click="() => { index--; open = false; }" size="icon"
                        variant="outline" class="rounded-full">
                        <LucideChevronLeft />
                    </Button>
                    <div v-else></div>
                    <Button v-if="getQuiz(index + 1)" @click="() => { index++; open = false; }" size="icon"
                        variant="outline" class="rounded-full">
                        <LucideChevronRight />
                    </Button>
                    <div v-else></div>
                </div>
                    <div class="flex-1"></div>
                    <br>
                    <div class="w-full h-[190px] overflow-hidden">
                        <div id="yandex_rtb_R-A-19395198-5"></div>
                    </div>
                    <br>
                </div>
            </ScrollArea>
        </div>
    </div>
</template>
