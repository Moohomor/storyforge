<script setup>
import { ref, onMounted } from "vue"
import PostCard from "../components/PostCard.vue"
const loadingPosts = ref(true)
const backendUrl = import.meta.env.VITE_BACKEND_URL
const posts=ref([])
const postNames = []
let shift = 0
function loadPosts() {
	for (let i=shift;i<Math.min(shift+10,postNames.length);i++) {
    	const [author, title] = postNames[i].split('/')
    	posts.value.push({'title':title,'author':author,'description':'Автор: '+author})
	}
}
onMounted(async ()=>{
	const resp = await fetch(`${backendUrl}/api/list_all_public_projects`)
    for (const path of (await resp.json()))
    	postNames.push(path)
    loadPosts()
    loadingPosts.value = false
})
</script>

<template>
	<main>
		<main class="container">
			<div class="container d-flex justify-content-between">
				<h1>Истории<span v-if="loadingPosts" class="spinner-border mx-3" role="status"></span></h1>
				<a class="btn btn-light" href="/app-qr.jpeg" role="button">Android-приложение</a>
			</div>
			<br>
			<div class="row">
				<PostCard v-for="(post, i) in posts" :key="i" :post="post" :link="'read'" :params="''" />
			<button 
				v-if="postNames.length > posts.length" 
				@click="shift+=10"
				class="card btn btn-outline-dark btn-lg mt-4">
				Load more
			</button>
			<h1 v-else><br>Всё просмотрено о_О</h1>
			</div>
		</main>
	</main>
</template>