const pool = require('../config/db')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')

// 登录
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body
    const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username])
    if (users.length === 0) {
      return res.status(400).json({ message: '用户名或密码错误' })
    }
    const user = users[0]
    const isMatch = await bcrypt.compare(password, user.password)
    if (!isMatch) {
      return res.status(400).json({ message: '用户名或密码错误' })
    }
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    )
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}