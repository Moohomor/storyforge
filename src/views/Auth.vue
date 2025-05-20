<script setup>
import { reactive, ref } from 'vue'

const loginForm = reactive({
  username: '',
  password: ''
})

const registerForm = reactive({
  username: '',
  password: ''
})

const loginError = ref('')
const registerError = ref('')
const registerSuccess = ref('')

const loginLoading = ref(false)
const registerLoading = ref(false)

const backendUrl = import.meta.env.VITE_BACKEND_URL

async function login() {
  loginError.value = ''
  loginLoading.value = true
  try {
    const response = await fetch(
      `${backendUrl}/auth/login?name=${encodeURIComponent(loginForm.username)}&password=${encodeURIComponent(loginForm.password)}`
    )
    if (response.ok) {
      const data = await response.json()
      if (data.token) {
        localStorage.setItem('authToken', data.token)
        localStorage.setItem('username', loginForm.username)
        window.location.href = '/#'  // 🔁 простой редирект
      } else {
        loginError.value = 'Неверный ответ сервера.'
      }
    } else if (response.status === 403) {
      loginError.value = 'Неверный пароль.'
    } else {
      loginError.value = 'Ошибка входа.'
    }
  } catch (e) {
    console.log(e)
    loginError.value = 'Ошибка сети.'
  } finally {
    loginLoading.value = false
  }
}

async function register() {
  registerError.value = ''
  registerSuccess.value = ''
  registerLoading.value = true
  try {
    registerForm.username = registerForm.username.replace(' ','-')
    const response = await fetch(
      `${backendUrl}/auth/signup?name=${encodeURIComponent(registerForm.username)}&password=${encodeURIComponent(registerForm.password)}`,
      { method: 'POST' }
    )
    if (response.ok) {
      const data = await response.json()
      localStorage.setItem('authToken', data.token)
      localStorage.setItem('username', registerForm.username)
      window.location.href = '/#'
    }
     else if (response.status === 409) {
      registerError.value = 'Пользователь уже зарегистрирован.'
    } else {
      registerError.value = 'Ошибка регистрации.'
    }
  } catch (e) {
    console.log(e)
    registerError.value = 'Ошибка сети.'
  } finally {
    registerLoading.value = false
  }
}
</script>

<template>
  <div class="alert alert-danger" v-if="loginError">
    <h6>Ошибка при входе</h6>
    {{loginError}}
  </div>
  <div class="alert alert-danger" v-if="registerError">
    <h6>Ошибка при регистрации</h6>
    {{registerError}}
  </div>
  <div class="row justify-content-center align-items-stretch" style="min-height: 400px">
    <!-- Войти -->
    <div class="col-md-5">
      <h3 class="text-center mb-4">Войти</h3>
      <form @submit.prevent="login">
        <div class="mb-3">
          <input type="text" class="form-control" placeholder="Логин" v-model="loginForm.username" />
        </div>
        <div class="mb-3">
          <input type="password" class="form-control" placeholder="Пароль" v-model="loginForm.password" />
        </div>
        <button
          type="submit"
          class="btn btn-outline-dark w-100"
          :disabled="loginLoading">
          {{ loginLoading ? 'Продолжаем...' : 'Продолжим' }}
        </button>
      </form>
    </div>

    <!-- Разделитель -->
    <div class="col-md-1 d-flex justify-content-center">
      <div class="vr h-100" style="width: 1px; background-color: #ccc;"></div>
    </div>


    <!-- Регистрация -->
    <div class="col-md-5">
      <h3 class="text-center mb-4">Зарегистрироваться</h3>
      <form @submit.prevent="register">
        <div class="mb-3">
          <input type="text" class="form-control" placeholder="Логин" v-model="registerForm.username" />
        </div>
        <div class="mb-3">
          <input type="password" class="form-control" placeholder="Пароль" v-model="registerForm.password" />
        </div>
        <button
          type="submit"
          class="btn btn-outline-dark w-100"
          :disabled="registerLoading">
          {{ registerLoading ? 'Приступаем...' : 'Приступим' }}
        </button>
      </form>
    </div>
  </div>
</template>
