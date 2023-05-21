<script setup lang="ts">
import { useWsPkg } from '../../hooks/useWsPkg'

const { sendWs, socketData, destroyWs, initWs, connected, status } = useWsPkg(import.meta.env.VITE_WEBSOCKET_URL)
const msg = ref()
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
        <p mb-2>
          connected:  {{ connected }}
        </p>
        <template v-if="connected">
          <input v-model="msg" b="1 red" mx-1>
          <button btn mx-1 @click="sendWs(msg) ">
            发送
          </button>
          <button btn mx-1 @click="sendWs('#CLOSE') ">
            发送断开ping命令
          </button>
          <button btn mx-1 @click="destroyWs()">
            断开连接
          </button>
        </template>
        <button v-else btn mx-1 @click="initWs()">
          重新连接
        </button>
        <div v-if="status" p-3 bg-red text-white my-2>
          {{ status }}
        </div>
      </div>
    </div>
  </div>
</template>
