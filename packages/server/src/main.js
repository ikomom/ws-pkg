const WebSocket = require('ws')

const wss = new WebSocket.Server({ port: 9888 })

wss.on('connection', (ws) => {
  console.log('server : receive connection.', wss.clients)

  ws.on('message', (message) => {
    console.log('server: received message: %s', message)
    ws.send('reply')
  })

  ws.on('close', () => {
    console.log('websocket close ', wss.clients)
  })
})
