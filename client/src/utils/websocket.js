class WebSocketService {
  constructor() {
    this.socket = null
  }

  connect(url) {
    this.socket = new WebSocket(url)
    this.socket.onopen = () => console.log('✅ WebSocket 已连接')
    this.socket.onclose = () => console.log('❌ WebSocket 已断开')
  }

  onMessage(callback) {
    this.socket.onmessage = (event) => callback(JSON.parse(event.data))
  }
}

export default new WebSocketService()