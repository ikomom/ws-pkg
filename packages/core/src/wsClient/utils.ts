type WebSocketType = typeof WebSocket

declare global {
  const MozWebSocket: WebSocketType
  interface Window {
    MozWebSocket: WebSocketType
  }
}

export function getWebsocket() {
  let ws: WebSocketType
  if (typeof WebSocket !== 'undefined')
    ws = WebSocket
  else if (typeof MozWebSocket !== 'undefined')
    ws = MozWebSocket
  else if (typeof window !== 'undefined')
    ws = window.WebSocket || window.MozWebSocket
  else if (typeof self !== 'undefined')
    ws = self.WebSocket || self.MozWebSocket
  else
    throw new Error('your browser unspport websocket')

  return ws
}
