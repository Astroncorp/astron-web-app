<script setup lang="ts">
import { Toaster } from "@/components/ui/sonner";

onMounted(() => {
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
	</div>
</template>
