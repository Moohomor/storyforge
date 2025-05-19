<script setup>
import PostCard from "../components/PostCard.vue"
const backendUrl = import.meta.env.VITE_BACKEND_URL
import { ref, computed, reactive, onMounted } from 'vue'
const projects = ref([])
const uuid = ref('')
const username = ref('')
// const total_posts=ref(10000);
async function loadProjects() {
    const resp = await fetch(`${backendUrl}/api/list?uuid=${encodeURIComponent(uuid.value)}&project=`)
    for (var i of (await resp.json())) {
    	if (i!='credentials.json')
    		projects.value.push({'title':i,'author':username.value})
    }
}
async function newProject() {
	let name = prompt("Введите название проекта", "")
	if (name==null||name=='') {
		alert('Название проекта некорректно')
		return
	}
	const resp = await fetch(`${backendUrl}/api/md?uuid=${encodeURIComponent(uuid.value)}&name=/${encodeURIComponent(name)}`,
      { method: 'POST' })
	if (resp.ok)
		location.reload()
	else
		alert('Ошибка при создании проекта')
}
onMounted(async function () {
	if (await authorized()) {
	    uuid.value=localStorage.getItem('authToken')
	    username.value=localStorage.getItem('username')
	   	await loadProjects()
	}
   	else
   		window.location.href = '/#/auth'
})
</script>
<template>
<main class="container">
	<div class="row">
		<h1 class="col-auto mr-auto">Мои проекты</h1>
		<button @click="newProject" class="col-auto align-self-end btn btn-light"><h4>+</h4></button>
	</div>
	<br>
	<div class="row">
		<PostCard v-for="(project, i) in projects" :key="i" :post="project" :link="'edit'" :params="`uuid=${uuid}`" />
		<!-- <button
		v-if="total_posts > projects.length" 
		@click="console.log('boop')"
		class="card btn btn-outline-dark btn-lg mt-4">
		Load more
		</button> -->
	</div>
</main>
</template>