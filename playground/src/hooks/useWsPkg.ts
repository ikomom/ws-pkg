import { WsClient } from '@ws-pkg/core'

const baseOpt = {
  autoInit: true,
}

export function useWsPkg(url: string, option?: Partial<typeof baseOpt>) {
  const opt = { ...baseOpt, ...option }

  // socket 实例
  let instance: WsClient | null
  // socket 消息
  const socketData = ref<unknown[]>([])
  const connected = ref(false)

  const destroyWs = () => {
    if (instance) {
      // 销毁socket
      instance.destroy()
      instance = null
    }
  }

  const sendWs = (data: unknown) => {
    instance?.send(typeof data !== 'string' ? JSON.stringify(data) : data)
  }
  const initWs = (_url = url) => {
    destroyWs()
    instance = new WsClient(_url)
    instance.on('notify', (data: unknown) => {
      console.log('[useWsPkg notify] ', data)
      socketData.value.push(data)
    })
    instance.on('onopen', () => {
      connected.value = true
    })
    instance.on('onerror', (ev) => {
      console.log('[useWsPkg onerror]', ev)
      connected.value = false
    })
    instance.on('onclose', (...args) => {
      console.log('[useWsPkg onclose]', args)
      connected.value = false
    })
  }

  opt.autoInit && initWs()

  onBeforeUnmount(() => {
    destroyWs()
  })

  return {
    connected,
    socketData,
    initWs,
    destroyWs,
    sendWs,
  }
}
