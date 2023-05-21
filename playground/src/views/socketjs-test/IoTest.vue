<script setup lang="ts">
import SockJS from 'sockjs-client'

function init() {
  const sock = new SockJS('http://localhost:9999/echo')
  console.log(sock)

  sock.onopen = function () {
    console.log('open')
    sock.send('test')
  }

  sock.onmessage = function (e) {
    console.log('message', e.data)
    sock.close()
  }

  sock.onclose = function () {
    console.log('close')
  }
}
init()
</script>

<template>
  <div>
    <button btn @click="init">
      init
    </button>
  </div>
</template>
