import HeartCheck from './HeartCheck'
import Mitt from './Mitt'
import { getWebsocket } from './utils'

export type WsClientEmitEvent =
  'notify' |
  'onerror' |
  'notifyError' |
  'onclose' |
  'onopen' |
  'reconnection'

const baseOpt = {
  reconnectionTime: 3000,
  heartTime: 15000,
}
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

  options: typeof baseOpt

  constructor(url: string, opt?: Partial<typeof baseOpt>) {
    this.url = url
    this.options = { ...baseOpt, ...opt }
    this.mitt = new Mitt()
    this.createWebSocket()
  }

  createWebSocket() {
    const Socket = getWebsocket()
    this.ws = new Socket(this.url)
    this.heartCheck = new HeartCheck(this.options.heartTime)
    this.onopen()
    this.onopen()
    this.onerror()
    this.onclose()
    this.onmessage()
  }

  private onopen() {
    this.ws!.onopen = (ev) => {
      this.mitt.emit('onopen', ev)
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
      // console.log('[websocket onclose]', this.isCustomClose)
      this.mitt.emit('onclose', this.isCustomClose)
      if (this.isCustomClose)
        return
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
        if (data === '#PONG')
          return
        // console.log('[websocket onmessage]', data)
        // send message
        this.mitt.emit('notify', data)
      }
      catch (error) {
        console.error('[websocket onmessage]', error)
        this.mitt.emit('notifyError', error)
      }
    }
  }

  reconnection() {
    if (this.isReconnectionLoading)
      return
    this.isReconnectionLoading = true
    this.mitt.emit('reconnection')
    window.clearTimeout(this.timeId)
    this.timeId = window.setTimeout(() => {
      this.createWebSocket()
    }, this.options.reconnectionTime)
  }

  send(message: string) {
    console.log('====', this.readyState)
    // connect fail
    if (this.readyState !== 1) {
      this.errorStack.push(message)
      return
    }
    this.ws!.send(message)
  }

  get readyState() {
    return this.ws?.readyState ?? -1
  }

  on(eventName: WsClientEmitEvent, func: (...args: any[]) => void) {
    this.mitt.on(eventName, func)
  }

  off(eventName: WsClientEmitEvent, func: (...args: any[]) => void) {
    this.mitt.off(eventName, func)
  }

  /**
   * custom close current ws
   */
  close() {
    this.isCustomClose = true
    this.ws!.close()
  }

  /**
   * close and clear all
   */
  destroy() {
    this.close()
    this.ws = null
    this.errorStack = []
    this.mitt.clear()
  }
}
