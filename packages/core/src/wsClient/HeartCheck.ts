class HeartCheck {
  private timeoutObj = -1
  private serverTimeoutObj = -1

  constructor(private timeout = 6 * 1000) {
  }

  reset() {
    if (this.timeoutObj > 0) {
      window.clearTimeout(this.timeoutObj)
      this.timeoutObj = -1
    }
    if (this.serverTimeoutObj > 0) {
      window.clearTimeout(this.serverTimeoutObj)
      this.serverTimeoutObj = -1
    }
    return this
  }

  start(socket: WebSocket) {
    this.timeoutObj = window.setTimeout(() => {
      socket.send('#PING')
      // console.log('[websocket ping]', socket.bufferedAmount)
      this.serverTimeoutObj = window.setTimeout(() => {
        // when close, reconnect is trigger
        socket.close()
      }, this.timeout)
    }, this.timeout)
  }
}

export default HeartCheck
