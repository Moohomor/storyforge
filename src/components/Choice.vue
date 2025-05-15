<template>
  <div class="d-flex justify-content-center align-items-center min-vh-100">
    <div class="container py-3 text-center">
      <div class="mb-2">
        <button class="btn btn-dark w-100" disabled>
          {{ question }}
        </button>
      </div>
      <div v-for="(answer, index) in answers" :key="index" class="mb-2">
        <button class="btn btn-dark w-100" @click="selectAnswer(index)">
          {{ answer }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps(['answers'])
const emit = defineEmits(['answerSelected'])

const answersList = computed(() => props.answers.split(';'))
const question = computed(() => answersList.value[0] || '')
const answers = computed(() => answersList.value.slice(1))

function selectAnswer(answer) {
  emit('return', answer)
}
</script>