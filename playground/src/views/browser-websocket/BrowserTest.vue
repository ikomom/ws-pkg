<script setup lang="ts">
const ws = new WebSocket('ws://localhost:9888')

ws.onopen = (ev) => {
  console.log('onopen', { ev, ws })
}
ws.onmessage = (ev) => {
  console.log('onmessage', { ev })
}

ws.onclose = (ev) => {
  console.log('onclose', { ev })
}

ws.onerror = (ev) => {
  console.error('onerror', { ev })
}
</script>

<template>
  <div>1</div>
</template>

<style scoped>

</style>
