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

export const WebSocketState = {
  CONNECTING: 0,
  OPEN: 1,
  CLOSING: 2,
  CLOSED: 3,
}
const baseOpt = {
  reconnectionTime: 3000,
  heartTime: 15000,
}
// https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent/code
export const WebsocketCloseCodeMap: Record<number, string> = {
  1000: '正常断开连接',
  1001: '服务器断开连接',
  1002: 'websocket协议错误',
  1003: '客户端接受了不支持数据格式（只允许接受文本消息，不允许接受二进制数据，是客户端限制不接受二进制数据，而不是websocket协议不支持二进制数据）',
  1005: '表示没有提供状态代码，即使是预期的状态代码',
  1006: '异常关闭',
  1007: '客户端接受了无效数据格式（文本消息编码不是utf-8）',
  1009: '传输数据量过大',
  1010: '客户端终止连接',
  1011: '服务器终止连接',
  1012: '服务端正在重新启动',
  1013: '服务端临时终止',
  1014: '通过网关或代理请求服务器，服务器无法及时响应',
  1015: 'TLS握手失败',
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
    // options.url must be invalid
    if (!url.startsWith('ws://') && !url.startsWith('wss://'))
      throw new Error('[websocket init] invalid url')

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
      this.isReconnectionLoading = false
      this.reconnection()
    }
  }

  private onclose() {
    this.ws!.onclose = (ev) => {
      // console.log('[websocket onclose]', this.isCustomClose)
      this.mitt.emit('onclose', { code: ev.code, reason: WebsocketCloseCodeMap[ev.code] || ev.reason })
      if (this.isCustomClose)
        return
      this.isReconnectionLoading = false
      this.reconnection()
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
    // connect fail
    if (this.readyState !== WebSocketState.OPEN) {
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
    this.mitt.emit('onclose', { code: 0, reason: '手动断开' })
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
