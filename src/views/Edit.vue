<script setup>
import { ref, nextTick, onMounted, computed } from 'vue'
const backendUrl = import.meta.env.VITE_BACKEND_URL

const loadingList = ref(true)
const loadingPublish = ref(false)
const loadingAi = ref(false)
const projectTitle = ref('')
const username = ref('')
const uuid = ref('')
const files = computed(()=>Object.keys(fileContents.value))
const fileContents = ref({})
const path = ref(window.location.hash.slice(7,window.location.hash.length-42))
const currentFile = ref(files.value[0])
const editor = ref(null)
const ai_input = ref(null)
const ai_response = ref('Да, я свободен!')
const highlightInput = ref('')
const highlightWords = ['tx','char', 'bg','if','else','endif','loop','endloop','choice']
let currentPos=0

const onInput = () => {
  fileContents.value[currentFile.value] = editor.value.innerText
  applyHighlighting()
}

const applyHighlighting = () => {
  if (!editor.value) return

  const selection = window.getSelection()
  const range = selection.getRangeAt(0)
  const preCaretRange = range.cloneRange()
  preCaretRange.selectNodeContents(editor.value)
  preCaretRange.setEnd(range.endContainer, range.endOffset)
  const caretOffset = preCaretRange.toString().length

  // Исходный текст
  const rawText = editor.value.innerText

  // Сохраняем контент файла
  fileContents.value[currentFile.value] = rawText

  // Подсветка
  let html = rawText
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  highlightWords.forEach(word => {
    const regex = new RegExp(`\\b(${word})\\b`, 'g')
    html = html.replace(regex, '<span class="text-danger fw-bold">$1</span>')
  })

  editor.value.innerHTML = html
  restoreCaret(editor.value, caretOffset)
}

// Функция восстановления курсора по смещению
const restoreCaret = (el, offset) => {
  const range = document.createRange()
  const selection = window.getSelection()
  let currentOffset = 0
  let nodeStack = [el]
  let node, found = false

  while (!found && nodeStack.length > 0) {
    node = nodeStack.pop()

    if (node.nodeType === 3) {
      const nextOffset = currentOffset + node.length
      if (offset <= nextOffset) {
        range.setStart(node, offset - currentOffset)
        range.collapse(true)
        found = true
        break
      }
      currentOffset = nextOffset
    } else {
      let i = node.childNodes.length
      while (i--) {
        nodeStack.push(node.childNodes[i])
      }
    }
  }

  if (found) {
    selection.removeAllRanges()
    selection.addRange(range)
  }
}
const onKeyDown = (event) => {
  if (event.key === 'Enter') {
    event.preventDefault()

    // Вставка новой строки вручную
    insertTextAtCursor('\n')
    onInput() // Обновим текст и подсветку
  }
}

// Вспомогательная функция вставки текста в курсор
const insertTextAtCursor = (text) => {
  const sel = window.getSelection()
  if (!sel || !sel.rangeCount) return

  const range = sel.getRangeAt(0)
  range.deleteContents()

  const textNode = document.createTextNode(text)
  range.insertNode(textNode)

  // Перемещаем курсор после вставленного узла
  range.setStartAfter(textNode)
  range.collapse(true)

  sel.removeAllRanges()
  sel.addRange(range)
}


const openFile = (file) => {
  const extension = file.slice(file.length-4)
  if (!(extension=='.txt'||extension=='.mod'||extension=='.csv')) return
  currentFile.value = file
  nextTick(() => {
    editor.value.innerText = fileContents.value[file] || ''
    applyHighlighting()
  })
}

const fileInput = ref(null)

const triggerFileInput = () => {
  fileInput.value.click()
}

const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  const name = file.name
  if (!name.includes('.')) name+='.mod'
  if (name.endsWith('.txt')) name = name.slice(0,name.length-3)+'mod'
  if (!file) return

  const ext=name.slice(name.length-3)
  if (ext!='mod'||ext!='csv') {
    const formData = new FormData();
    formData.append('file', file);
    uploadBinFile(name, formData)
    fileContents.value[name] = 'raw'
    return
  }

  const reader = new FileReader()
  reader.onload = (e) => {
    const content = e.target.result

    // Добавляем файл в список и открываем его
    if (!files.value.includes(name)) {
      files.value.push(name)
    }
    fileContents.value[name] = content
    uploadFile(name, content)
    openFile(name)
  }
  reader.readAsText(file)
}

async function uploadBinFile(name, form) {
  if (!(await authorized())) {
    window.location.href='#/'
    return
  }
  const response = await fetch(
      `${backendUrl}/api/uploadb?uuid=${encodeURIComponent(localStorage.getItem('authToken'))}&name=${encodeURIComponent(projectTitle.value)}/${name}`,
      { method: 'POST',
        body: form }
    )
  console.log(response.ok?'OK':'NOT OK', name, await response.text())
}

async function newFile() {
  name = prompt('Введите название файла')
  if (name==''||name==null) {
    alert('Название некорректно')
    return
  }
  if (!name.includes('.')) name+='.mod'
  await uploadFile(name, '')
}

async function uploadFile(name, content) {
  if (!(await authorized())) {
    window.location.href='#/'
    return
  }
  console.log(name,content)
  const response = await fetch(
      `${backendUrl}/api/upload?uuid=${encodeURIComponent(localStorage.getItem('authToken'))}&name=${encodeURIComponent(projectTitle.value)}/${name}`,
      { method: 'POST',
        body: content }
    )
  console.log(response.ok?'OK':'NOT OK', name, await response.text())
}

const saveDraft = async () => {
  for (const [name, content] of Object.entries(fileContents.value)) {
    if (name.endsWith('.mod')||name.endsWith('.json')||name.endsWith('.csv'))
      uploadFile(name, content)
  }
}

const publish = async () => {
  loadingPublish.value = true
  saveDraft()
  const response = await fetch(
        `${backendUrl}/api/file_public?name=${encodeURIComponent(username.value)}/${encodeURIComponent(projectTitle.value)}`,
        { method: 'DELETE' }
      )
  if (!response.ok)
    console.log(response)
  // for (const [name, content] of Object.entries(fileContents.value)) {
    const resp = await fetch(
        `${backendUrl}/api/copy?uuid=${encodeURIComponent(uuid.value)}&from=/storage/${encodeURIComponent(username.value)}/${encodeURIComponent(projectTitle.value)}&to=/public/${encodeURIComponent(username.value)}/${encodeURIComponent(projectTitle.value)}`,
        { method: 'POST' }
      )
    console.log(resp.ok?'OK':'NOT OK', name, await response.text())
  // }
  loadingPublish.value = false
  alert('Проект опубликован')
}

async function ai_confirm(event) {
  if (event.key!=='Enter')
    return
  loadingAi.value=true
  const response = await fetch(`${backendUrl}/api/gpt`, { method: 'PUT', body: `Пользователь делает игру на языке Story Forge и спрашивает:\n${ai_input.value.value}Модули, написанные им:${JSON.stringify(fileContents.value)}` })
  if (response.ok) {
    const data = await response.json()
    console.log(data)
    loadingAi.value=false
    ai_response.value = data.content + `\n\n(${data.time_elapsed}s elapsed)`
  }
}

// Автоматически загружаем первый файл
onMounted(async function () {
  if (!(await authorized())) {
    window.location.href='#/'
    return
  }
  uuid.value=localStorage.getItem('authToken')
  username.value=localStorage.getItem('username')
  projectTitle.value=decodeURI(path.value.slice(username.value.length+1))
  const resp = await fetch(`${backendUrl}/api/list?uuid=${encodeURIComponent(uuid.value)}&project=${encodeURIComponent(projectTitle.value)}`)
  for (var i of (await resp.json())) {
    if (i.endsWith('.mod')||i.endsWith('.csv')) {
      const response = await fetch(
          `${backendUrl}/api/read?uuid=${encodeURIComponent(localStorage.getItem('authToken'))}&file=${projectTitle.value}/${encodeURIComponent(i)}`
        )
      if (response.ok) {
        fileContents.value[i] = await response.text()
      } else console.log(i)
    } else fileContents.value[i] = 'raw'
  }
  if (Object.keys(fileContents.value).length==0) {
    fileContents.value = {'main.mod': 'tx entry point\n-'}
    uploadFile('main.mod', 'tx entry point\n-')
  }
  currentFile.value='main.mod'
  openFile(currentFile.value)
  loadingList.value = false
})
</script>

<template>
  <div class="container mt-4">
    <h3>{{ projectTitle }}<span v-if="loadingList" class="spinner-border mx-2" role="status"></span></h3>
    <div class="row">
      <div class="col-3">
        <ul class="list-group">
          <li
            v-for="file in files"
            :key="file"
            class="list-group-item"
            :class="{ active: file === currentFile }"
            @click="openFile(file)"
            style="cursor: pointer"
          >
            {{ file }}
          </li>
        </ul>
      </div>

      <div class="col-9">
        <div class="mb-2 d-flex justify-content-end">
          <button class="btn btn-outline-primary" @click="triggerFileInput">Загрузить файл</button>
          <input type="file" ref="fileInput" class="d-none" @change="handleFileUpload" />
          <button class="btn btn-outline-success mx-2" @click="newFile">Создать файл</button>

          <button class="btn btn-outline-dark me-2" @click="saveDraft">Сохранить черновик</button>
          <button class="btn btn-dark" @click="publish">
            <span v-if="loadingPublish" class="spinner-border spinner-border-sm" aria-hidden="true"></span>
            Опубликовать
          </button>
        </div>

        <div
          ref="editor"
          class="form-control"
          contenteditable
          @keydown="handleKeydown"
          @input="onInput"
          style="white-space: pre-wrap; overflow-wrap: break-word;"
        ></div>

        <input
          ref="ai_input"
          class="form-control mt-5 mb-2"
          type="message"
          placeholder="Спросить у ИИ"
          @keydown="ai_confirm"
          style="white-space: pre-wrap; overflow-wrap: break-word;"
        ></input>
        <span v-if="loadingAi" class="spinner-border mx-2" role="status"></span>
        <div style="white-space: pre-wrap; overflow-wrap: break-word;" v-else><p>{{ai_response}}</p></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.list-group-item.active {
  background-color: #0d6efd;
  color: white;
  font-weight: bold;
}
.editor {
  white-space: pre-wrap;
  overflow-wrap: break-word;
}

</style>
