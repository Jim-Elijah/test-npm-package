const Koa = require('koa')
const http = require('http')
const cors = require('@koa/cors')
const bodyParser = require('koa-bodyparser')
const WebSocket = require('ws')
const WebSocketApi = require('./utils/ws')
const app = new Koa()

const server = http.createServer(app.callback())
const wss = new WebSocket.Server({ server })

WebSocketApi(wss, app)

app.use(cors())
app.use(bodyParser())

app.use(ctx => {
  ctx.body = 'Hello World'
})

server.listen(9800, () => {
  console.log(`listen to http://localhost:9800`)
})