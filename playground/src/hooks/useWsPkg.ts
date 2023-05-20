import { WsClient } from '@ws-pkg/core'

export function useWsPkg(url?: string) {
  // socket 实例
  let instance: WsClient | null
  // socket 消息
  const socketData = ref<string[]>([])

  const initWs = (url: string) => {
    instance = new WsClient(url)
    instance.on('notify', (data) => {
      console.log('接收服务端消息： ', data)
      socketData.value.push(data)
    })
  }
  if (url)
    initWs(url)

  const destroyWs = () => {
    if (instance) {
      // 销毁socket
      instance.destroy()
      instance = null
    }
  }

  const sendWs = (data: unknown) => {
    instance?.send(JSON.stringify(data))
  }

  return {
    socketData,
    initWs,
    destroyWs,
    sendWs,
  }
}
