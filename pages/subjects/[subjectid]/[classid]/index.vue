<script setup lang="ts">
import { LucideChevronLeft, LucideChevronRight } from "lucide-vue-next";

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

const { token, proPermissions } = storeToRefs(userStore);
const showProReminder = ref(false);

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

const getClassess = async () => {
    isLoading.value = true;
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
    isLoading.value = true;
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
    <div class="h-screen w-full">
        <div
            class="bg-background flex items-center gap-2 h-[3rem] p-2 border-b"
        >
            <div class="border rounded-full p-1" @click="router.back()">
                <LucideChevronLeft />
            </div>
            <p>Mavzular</p>
        </div>
        <div class="h-[calc(100%-6rem)] flex flex-col gap-2 px-5">
            <ScrollArea class="h-full">
                <br />
                <div class="bg-accent/30 rounded-md divide-y">
                    <div
                        v-for="theme in themes"
                        class="flex justify-between p-2"
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
                        <div class="flex items-center gap-2">
                            <p class="">{{ theme.mavzu_nomi }}</p>
                        </div>
                        <div class="flex items-center justify-center">
                            <LucideChevronRight />
                        </div>
                    </div>
                </div>
                <br />
            </ScrollArea>
        </div>
        <div
            v-if="$route.query.type === 'test'"
            class="bg-background flex items-center justify-center gap-2 h-[3rem] p-2 border-t"
        >
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
