<script lang="ts" setup>
const backendUrl = import.meta.env.VITE_BACKEND_URL
const props = defineProps(['post','link','params'])
</script>
<template>
	<div class="card text-bg-dark rounded-3 p-4 m-1" style="width: 18rem;height: 18rem;">
		<img :src="backendUrl+'api/read_public?file='+post.author+'/'+post.title+'/preview.jpg'" class="card-img" onerror="this.onerror=null; this.src=''" />
		<a :href="'#/'+props.link+'/'+post.author+'/'+post.title+(params?'?'+params:'')" class="card-img-overlay"style="background-color: hsla(0, 0%, 0%, .7);">
				<h4 class="card-title">{{post.title}}</h4>
				<p class="card-text">{{post.description}}</p>
		</a>
	</div>
</template>
<style>
	a {
		color:inherit;
		text-decoration: inherit;
	}
</style>