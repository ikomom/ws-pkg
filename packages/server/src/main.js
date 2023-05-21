// function sockIoTest() {
//   const http = require('node:http')
//   const sockjs = require('sockjs')
//
//   const echo = sockjs.createServer()
//   echo.on('connection', (conn) => {
//     conn.on('data', (message) => {
//       conn.write(message)
//     })
//     conn.on('close', () => {})
//   })
//
//   const server = http.createServer()
//   echo.installHandlers(server, { prefix: '/echo' })
//   server.listen(9999, '0.0.0.0')
// }

// sockIoTest()
require('./ws.js')
