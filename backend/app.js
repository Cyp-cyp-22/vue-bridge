const express = require('express')
const cors = require('cors')
const http = require('http')
const routes = require('./routes')
const initWebSocket = require('./websocket')
require('dotenv').config()

const app = express()
const server = http.createServer(app)
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.use('/api', routes)

initWebSocket(server)

server.listen(PORT, () => {
  console.log(`✅ 后端服务已启动：http://localhost:${PORT}`)
})