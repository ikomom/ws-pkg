<script setup lang="ts">
import { Emittery } from '@ws-pkg/core'

// import Emittery1 from 'emittery'

const emiitery = new Emittery()
const iterator = emiitery.events('a')
emiitery.emit('a', '2222')
emiitery.emit('a', '333')
emiitery.emit('b', 'xxx')

// for (const iterateElement of iterator)
//   console.log('iterator', iterateElement)

async function log() {
  for await (const iterateElement of iterator)
    console.log('iterator', iterateElement)
}
log()
</script>

<template>
  <div>22</div>
</template>
