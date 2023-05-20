import HeartCheck from './HeartCheck'
import Mitt from './Mitt'
import { getWebsocket } from './utils'

export type WsClientEmitEvent = 'notify' | 'onerror' | 'notifyError'

export class WsClient {
  url: string

  private ws: WebSocket | null

  private heartCheck: HeartCheck

  private mitt: Mitt<WsClientEmitEvent>

  isReconnectionLoading = false
  // delay reconnect id
  private timeId = -1

  private isCustomClose = false
  // error stack
  errorStack: string[] = []

  constructor(url: string) {
    this.url = url
    this.mitt = new Mitt()
    this.createWebSocket()
  }

  createWebSocket() {
    const Socket = getWebsocket()
    this.ws = new Socket(this.url)
    this.heartCheck = new HeartCheck()
    this.onopen()
    this.onopen()
    this.onerror()
    this.onclose()
    this.onmessage()
  }

  private onopen() {
    this.ws!.onopen = () => {
      console.log('websocket onopen')
      this.errorStack.forEach((message) => {
        this.send(message)
      })
      this.errorStack = []
      this.isReconnectionLoading = false
      this.heartCheck.reset().start(this.ws!)
    }
  }

  private onerror() {
    this.ws!.onerror = (err) => {
      console.error('[websocket onerror]', err)
      this.mitt.emit('onerror', err)
      this.reconnection()
      this.isReconnectionLoading = false
    }
  }

  private onclose() {
    this.ws!.onclose = () => {
      if (this.isCustomClose)
        return
      // 重新连接
      this.reconnection()
      this.isReconnectionLoading = false
    }
  }

  private onmessage() {
    this.ws!.onmessage = (event) => {
      try {
        const data = event.data
        // reset HeartCheck
        this.heartCheck.reset().start(this.ws!)
        if (data.data === 'pong')
          return
        // send message
        this.mitt.emit('notify', data)
      }
      catch (error) {
        console.error('[websocket onmessage]', error)
        this.mitt.emit('notifyError', error)
      }
    }
  }

  // 重新链接
  reconnection() {
    if (this.isReconnectionLoading)
      return
    this.isReconnectionLoading = true
    window.clearTimeout(this.timeId)
    this.timeId = window.setTimeout(() => {
      this.createWebSocket()
    }, 3000)
  }

  send(message: string) {
    // connect fail
    if (this.ws!.readyState !== 1) {
      this.errorStack.push(message)
      return
    }
    this.ws!.send(message)
  }

  on(eventName: WsClientEmitEvent, func: (...args: any[]) => void) {
    this.mitt.on(eventName, func)
  }

  off(eventName: WsClientEmitEvent, func: (...args: any[]) => void) {
    this.mitt.off(eventName, func)
  }

  // 手动关闭
  close() {
    this.isCustomClose = true
    this.ws!.close()
  }

  // 销毁
  destroy() {
    this.close()
    this.ws = null
    this.errorStack = []
    this.mitt.clear()
  }
}
