<script setup lang="ts">
import { Toaster } from "@/components/ui/sonner";

const showLoadingGate = ref(true);
const loadingProgress = ref(0);

let progressTimer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
	const gateStartedAt = performance.now();
	const gateDuration = 5000;

	const updateLoadingProgress = () => {
		const elapsed = performance.now() - gateStartedAt;
		const step = Math.min(5, Math.floor(elapsed / 1000));

		loadingProgress.value = step * 20;

		if (elapsed >= gateDuration) {
			loadingProgress.value = 100;
			showLoadingGate.value = false;

			if (progressTimer) {
				clearInterval(progressTimer);
				progressTimer = null;
			}
		}
	};

	updateLoadingProgress();
	progressTimer = setInterval(updateLoadingProgress, 100);

	window.yaContextCb = window.yaContextCb || [];

	if (
		window.yaContextCb ||
		window.yaContextCb !== null ||
		window.yaContextCb !== undefined
	) {
		window.yaContextCb.push(() => {
			Ya.Context.AdvManager.render({
				blockId: "R-A-19395198-2",
				type: "fullscreen",
				platform: "touch",
			});
		});
	}
});

onBeforeUnmount(() => {
	if (progressTimer) {
		clearInterval(progressTimer);
		progressTimer = null;
	}
});
</script>

<template>
	<div>
		<NuxtRouteAnnouncer />
		<NuxtLoadingIndicator />
		<ClientOnly>
			<Toaster position="top-left" />
		</ClientOnly>
		<NuxtLayout>
			<ClientOnly>
				<NuxtPage />
			</ClientOnly>
		</NuxtLayout>

		<ClientOnly>
			<div v-if="showLoadingGate" class="loading-gate">
				<div class="loading-gate__brand">Astron | Tarix</div>

				<div class="loading-gate__content">
					<div class="loading-gate__title">Ilova yuklanmoqda...</div>

					<div class="loading-gate__progress-track">
						<div
							class="loading-gate__progress-fill"
							:style="{ width: `${loadingProgress}%` }"
						></div>
					</div>

					<div class="loading-gate__percent">
						{{ loadingProgress }}%
					</div>
				</div>

				<div class="loading-gate__bot">@astrontest_bot</div>
			</div>
		</ClientOnly>
	</div>
</template>

<style scoped>
.loading-gate {
	position: fixed;
	inset: 0;
	z-index: 1000;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: space-between;
	box-sizing: border-box;
	width: 100%;
	height: 100vh;
	height: 100dvh;
	padding: 24px 20px 36px;
	background: #ffffff;
	color: #111111;
	touch-action: none;
	overscroll-behavior: none;
}

.loading-gate__brand {
	margin-top: 4px;
	font-size: 20px;
	font-weight: 700;
	line-height: 1.2;
	text-align: center;
}

.loading-gate__content {
	width: min(82vw, 330px);
	text-align: center;
}

.loading-gate__title {
	margin-bottom: 16px;
	font-size: 17px;
	font-weight: 600;
	line-height: 1.3;
}

.loading-gate__progress-track {
	overflow: hidden;
	width: 100%;
	height: 13px;
	border-radius: 999px;
	background: #e6e6e6;
}

.loading-gate__progress-fill {
	height: 100%;
	border-radius: inherit;
	background: #333333;
	transition: width 180ms ease-out;
}

.loading-gate__percent {
	margin-top: 10px;
	font-size: 16px;
	font-weight: 500;
	line-height: 1.2;
}

.loading-gate__bot {
	font-size: 15px;
	font-weight: 500;
	line-height: 1.2;
	text-align: center;
}
</style>
