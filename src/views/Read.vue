<script lang="ts" setup>
import { ref, computed, reactive, onMounted } from 'vue'
import Choice from "../components/Choice.vue"
const backendUrl = import.meta.env.VITE_BACKEND_URL
const uuid = ref('')
const isFullscreen = ref(false)
const loadingMods = ref(true)
const pos = ref(0)
const path = ref('')
const nvars = reactive({choice: -1})
const vars = reactive({'Engine.text': '', 'Engine.char': '', 'Engine.bg_name': ''})
const state = ref(null)
const answers = ref('')
let ifs = []
let mods = null
async function loadModules() {
    const response = await fetch(`${backendUrl}/api/list_public?project=${encodeURIComponent(window.location.hash.slice(7))}`)
    let r = {}
    if (!response.ok) {print(response);return;}
    for (var i of (await response.json())) {
        if (!i.endsWith('.mod')) continue;
        const name = i.slice(0,i.length-4)
        const resp = await fetch(`${backendUrl}/api/read_public?file=${encodeURIComponent(window.location.hash.slice(7))}/${i}`)
        if (resp.ok) {
            r[name] = {rows:null,blocks:null}
            r[name].rows = (await resp.text()).split('\n')
        }
        let blocks = {ifs:{},loops:{}}
        let ifs = [], elses = []
        // for (let i=1;i<r[name].rows.length;i++)
        //     if (r[name].rows[i].trim().startsWith('-')&&r[name].rows[i-1].trim().startsWith('choice'))
        //         delete r[name].rows[i]
        // r[name].rows = r[name].rows.filter(x=>x!==undefined)
        const rows = r[name].rows
        for (let k in rows) {
            k = parseFloat(k)
            const row = rows[k].trim()
            if (row.startsWith('if')) 
                ifs.push(k)
            else if (row.startsWith('else'))
                elses.push(k)
            else if (row.startsWith('endif')) {
                if (!ifs)
                    return 'Слишком много токенов "endif"'
                const st = ifs.pop()
                blocks.ifs[st]={start:st,els:(elses.length==ifs.length+1?elses.pop():-1),end:k}
            }
        }
        r[name].blocks = blocks
        console.log(name,'mod blocks',blocks)
    }
    mods = r||{'main': {rows:'char Ошибка\ntx Либо такой истории нет, либо main.mod пуст\n-'.split('\n'),blocks:{}}}
}
let mod_stack = []
const mod = computed(()=>mods[mod_name.value])
const mod_name = ref('main')
function nextLine() {
    console.log('Step! Pos '+pos.value+' at '+mod_name.value)
    for (;;pos.value++) {
        if (pos.value>=mod.value.rows.length) {
            if (mod_stack.length) {
                let prev = mod_stack.pop()
                mod_name.value=prev.name
                pos.value=prev.pos
                continue
            } else window.location.href = '/#'
        }
        let line = mod.value.rows[pos.value].trim()
        const hashpos = line.indexOf('#')
        console.log(line, hashpos)
        if (line==='-') {
            const data = {
                nvars: nvars,
                vars: vars,
                modstack: mod_stack,
                current_mod: mod_name.value,
                current_pos: pos.value-1,
            }
            localStorage.setItem('autosave_'+path.value, JSON.stringify(data))
            pos.value++
            break
        }
        if (hashpos!=-1)
            line = line.slice(0, hashpos)
        line = line.trim()
        if (line=='') continue
        if (line.startsWith('tx'))
            // current.tx=line.slice(3)
            vars['Engine.text'] = line.slice(3)
        else if (line.startsWith('char'))
            // current.char=line.slice(5)
            vars['Engine.char'] = line.slice(5)
        else if (line.startsWith('bg'))
            vars['Engine.bg_name']=line.slice('3')
        else if (line.startsWith('goto')) {
            mod_stack.push({name:mod_name.value,pos:pos.value})
            mod_name.value = line.slice(5)
            pos.value = -1
        } else if (line.startsWith('if')) {console.log(111)
            const blk=mod.value.blocks.ifs[pos.value]
            ifs.push(blk)
            if (!evaluate(line.slice(3)))
                pos.value=blk.els!=-1?blk.els:blk.end
        } else if (line.startsWith('else'))
            pos.value = ifs.at(-1).end
        else if (line.startsWith('endif'))
            ifs.pop()
        else if (line.startsWith('choice')) {
            answers.value = line.slice(7)
            pos.value+=2
            state.value = Choice
            break
        } else if (line.includes('=')) {
            const [name, expr] = line.split('=')
            nvars[name.trim()] = evaluate(expr)
        }
    }
}
function answerSelected(idx) {
    nvars.choice=idx
    state.value = null
    nextLine()
}
function evaluate(expr) {
    let vars_str = ''
    for (const [name,value] of Object.entries(nvars))
        vars_str+=`const ${name}=${value};`
    console.log(vars_str+expr,eval(vars_str+expr))
    return eval(vars_str+expr)
}
function toggleFullscreen() {
    if (!isFullscreen.value)
        document.documentElement.requestFullscreen();
    else
        document.exitFullscreen();
    isFullscreen.value = !isFullscreen.value;
}
onMounted(async function () {
    path.value=decodeURI(window.location.hash.slice(7))
    const err = await loadModules()
    if (err) {
        current.tx = err
        return
    }
    const json_data = localStorage.getItem('autosave_'+path.value)
    if (json_data !== null && confirm('Вернуться с того места, где закончили в прошлый раз?')) {
        const data = JSON.parse(json_data)
        Object.keys(data.nvars).forEach(name=>nvars[name]=data.nvars[name])
        Object.keys(data.vars).forEach(name=>vars[name]=data.vars[name])
        mod_stack = data.modstack
        mod_name.value = data.current_mod
        pos.value = data.current_pos
    }
    loadingMods.value = false
    nextLine()
})
</script>

<template>
    <button class="btn btn-light fullscreen-btn" @click="toggleFullscreen">
        {{ isFullscreen ? "Выйти из полноэкранного" : "Полноэкранный режим" }}
    </button>
    <main v-if="state==null" class="read-background" :style="{ background: `url(${backendUrl}/api/read_public?file=${encodeURIComponent(path)}/${encodeURIComponent(vars['Engine.bg_name'])})`,'background-size':'100% 100%' }" @click="nextLine">
        <div class="dialogue-box" :style="background-color" v-if="vars['Engine.text']||vars['Engine.char']">
            <div v-if="vars['Engine.char']" class="character-name">{{ vars['Engine.char'] }}</div>
            <span v-if="loadingMods" class="spinner-grow mx-2" role="status"></span>
            <div>{{ vars['Engine.text'] }}</div>
        </div>
    </main>
    <component v-else @return="answerSelected" :is="state" :answers="answers" class="read-background" :style="{ background: `url(${backendUrl}/api/read_public?file=${path}/${vars['Engine.bg_name']})`,'background-size':'100% 100%' }" />
</template>

<style>
    .read-background {
      position: absolute;
      width: 100%;
      height: 100%;
    }
    .dialogue-box {
      position: absolute;
      hyphens: auto;
      word-break: normal;
      bottom: 0;
      width: 100%;
      background-color: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 1rem;
    }

    .character-name {
      background-color: rgba(64, 64, 64, 0.8);
      display: inline-block;
      margin-bottom: 0.5rem;
      padding: 0.25rem 1rem;
      border-radius: 1rem;
    }

    .fullscreen-btn {
      position: absolute;
      top: 10px;
      right: 10px;
      z-index: 1000;
    }
</style>