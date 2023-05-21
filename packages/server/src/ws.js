const WebSocket = require('ws')

const wss = new WebSocket.Server({ port: 9999 })

// \x1E
const SEPARATOR = ''
wss.on('connection', (ws) => {
  console.log('server : receive connection.')

  ws.on('message', (message) => {
    const msg = message.toString()
    console.log('server: received message: %s', msg)

    if (msg === '#PING') {
      ws.send(`#PONG${SEPARATOR}`)
      return
    }
    else if (msg === '#CLOSE') {
      ws.close()
      return
    }
    ws.send(`<b>收到:</b> ${msg}${SEPARATOR}`)
  })
  ws.send(JSON.stringify({ type: 'init', time: new Date().getTime() }) + SEPARATOR)
  ws.send('《春江花月夜》\n'
      + '\n'
      + '春江潮水连海平，海上明月共潮生。 滟滟随波千万里，何处春江无月明？ 江流宛转绕芳甸，月照花林皆似霰； 空里流霜不觉飞，汀上白沙看不见。 江天一色无纤尘，皎皎空中孤月轮。 江畔何人初见月？江月何年初照人？ 人生代代无穷已，江月年年只相似。 不知江月待何人，但见长江送流水。 白云一片去悠悠，青枫浦上不胜愁。 谁家今夜扁舟子？何处相思明月楼？ 可怜楼上月徘徊，应照离人妆镜台。 玉户帘中卷不去，捣衣砧上拂还来。 此时相望不相闻，愿逐月华流照君。 鸿雁长飞光不度，鱼龙潜跃水成文。 昨夜闲潭梦落花，可怜春半不还家。 江水流春去欲尽，江潭落月复西斜。 斜月沉沉藏海雾，碣石潇湘无限路。 不知乘月几人归，落月摇情满江树。')

  ws.on('close', () => {
    console.log('websocket close ')
  })
})
