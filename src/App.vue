<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import Home from './views/Home.vue'
import Own from './views/Own.vue'
import Account from './views/Account.vue'
import NotFound from './views/NotFound.vue'
import Read from './views/Read.vue'
import Edit from './views/Edit.vue'
import Auth from './views/Auth.vue'

const backendUrl = import.meta.env.VITE_BACKEND_URL
const loadingAuth=ref(true)

const routes = {
  '/': Home,
  '/my': Own,
  '/me': Account,
  '/auth': Auth,
}

const currentPath = ref(window.location.hash)

window.addEventListener('hashchange', () => {
  currentPath.value = window.location.hash
})

const currentView = computed(() => {
  loadingAuth.value=true
  update_username()
  loadingAuth.value=false
  switch (currentPath.value.slice(2,6)){
    case "read":
      return Read
    case "edit":
      return Edit
  }
  return routes[currentPath.value.slice(1) || '/'] || NotFound
})
const username = ref('')
async function update_username() {
  if (await authorized())
    username.value=localStorage.getItem('username')
  else
    localStorage.removeItem('username')
}

onMounted(update_username)

const logoutLoading = ref(false)
const logoutError = ref('')
async function logout() {
  try {
    const response = await fetch(
      `${backendUrl}/auth/logout?uuid=${encodeURIComponent(localStorage.getItem('authToken'))}`,
      { method: 'POST' }
    )
    if (response.ok) {
      localStorage.removeItem('authToken')
      localStorage.removeItem('username')
      location.reload()
    }
     else if (response.status === 403) {
      logoutError.value = 'Сессия недействительна.'
    } else {
      logoutError.value = 'Ошибка выхода.'
    }
  } catch (e) {
    console.log(e)
  } finally {
    localStorage.removeItem('authToken')
    localStorage.removeItem('username')
    logoutLoading.value = false
    window.location.href='#/'
  }
}
</script>

<template>
  <nav v-if="currentView!=Read" class="navbar">
    <div class="container">
      <a class="navbar-brand" href="#/">Story Forge</a>
      <a class="nav-link" href="#/">Истории</a>
      <a class="nav-link" href="#/my">Мои проекты</a>
      <a class="nav-link" href="https://github.com/moohomor/storyforge/wiki">Помогите</a>
      <a class="nav-link" :href="username!=''?'#/me':'#/auth'"><span v-if="loadingAuth" class="spinner-border spinner-border-sm" aria-hidden="true"></span>{{username||"Аккаунт"}}</a>
      <button class="nav-link" v-if="username!=''" :disabled="logoutLoading" @click="logout">{{logoutLoading?'Выходим...':'Выйти'}}</button>
    </div>
  </nav>
  <component :is="currentView" :class="![Read].includes(currentView)?'mt-5 mx-5 mb-5':''"/>
</template>