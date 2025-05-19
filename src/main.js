import { createApp } from 'vue'
import App from './App.vue'

const backendUrl = import.meta.env.VITE_BACKEND_URL

window.authorized = async function () {
		const response = await fetch(
	      `${backendUrl}/auth/authorized?uuid=${encodeURIComponent(localStorage.getItem('authToken'))}`
	    )
	    if (response.ok) {
	    	return await response.text()==='1'
	    }
	}

createApp(App).mount('#app')
