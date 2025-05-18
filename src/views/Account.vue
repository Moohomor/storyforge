<script lang="ts" setup>
import { onMounted, ref } from "vue"
const src = ref('')
onMounted(async () => {
	const resp = await fetch('https://api.thecatapi.com/v1/images/search')
	const json = await resp.json()
	src.value = json[0].url
})
</script>
<template>
	<main class="container d-flex justify-content-center">
		<h1>Здесь будут все ваши игры, а пока посмотрите на этого кота</h1>
		<img :src="src" style="height: 34rem;">
	</main>
</template>