const socketIo = require('socket.io')

let io = null
let onlineCount = 0

const initWebSocket = (server) => {
  io = socketIo(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  })

  io.on('connection', (socket) => {
    onlineCount++
    io.emit('online', onlineCount)

    socket.on('disconnect', () => {
      onlineCount--
      io.emit('online', onlineCount)
    })
  })

  setInterval(() => {
    io.emit('update', {
      time: new Date().toLocaleTimeString(),
      visits: Math.floor(Math.random() * 100)
    })
  }, 3000)
}

module.exports = initWebSocket