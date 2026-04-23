const express = require('express')
const router = express.Router()
const mysql = require('mysql2')
require('dotenv').config()

// 数据库连接（根据你的截图信息写死）
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root123456', // 你截图里写的是这个
  database: 'bridge_dashboard',
  port: 3306
})

// 连接测试（可选，方便排查）
db.connect((err) => {
  if (err) {
    console.error('❌ 数据库连接失败:', err)
  } else {
    console.log('✅ 数据库连接成功')
  }
})

// 登录接口
router.post('/login', (req, res) => {
  const { username, password } = req.body
  const sql = "SELECT * FROM users WHERE username = ? AND password = ?"

  db.query(sql, [username, password], (err, result) => {
    if (err) {
      console.error('❌ 查询错误:', err)
      return res.status(500).json({ message: '服务器错误' })
    }
    if (result.length > 0) {
      return res.json({ token: "login_success" })
    } else {
      return res.status(401).json({ message: "账号或密码错误" })
    }
  })
})

// 获取桥梁数据
router.get('/bridges', (req, res) => {
  const sql = "SELECT * FROM bridges"
  db.query(sql, (err, data) => {
    if (err) return res.status(500).json(err)
    return res.json(data)
  })
})

// 获取古道数据
router.get('/roads', (req, res) => {
  const sql = "SELECT * FROM roads"
  db.query(sql, (err, data) => {
    if (err) return res.status(500).json(err)
    return res.json(data)
  })
})

// 获取古道-桥梁关联数据
router.get('/road-bridge-relation', (req, res) => {
  const sql = "SELECT * FROM road_bridge_relation"
  db.query(sql, (err, data) => {
    if (err) return res.status(500).json(err)
    return res.json(data)
  })
})

module.exports = router