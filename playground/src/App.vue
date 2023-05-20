<script setup lang="ts">
import { useWsPkg } from './hooks/useWsPkg'

const { sendWs, socketData, destroyWs } = useWsPkg('ws://121.40.165.18:8800')
const msg = ref()

onBeforeUnmount(() => {
  destroyWs()
})
</script>

<template>
  <div font-sans leading-1em>
    <div flex>
      <ul flex-1 p-3 overflow-y-auto h-80vh>
        <li v-for="(item, idx) in socketData" :key="idx" b-1 p-3>
          <div v-html="item" />
        </li>
      </ul>
      <div flex-1 p-3>
        <input v-model="msg" b="1 red">
        <button @click="sendWs(msg) ">
          发送
        </button>
      </div>
    </div>
  </div>
</template>
