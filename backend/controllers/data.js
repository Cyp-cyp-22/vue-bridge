const pool = require('../config/db')

// 获取所有古桥
exports.getBridges = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM bridges')
    res.json(rows)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// 获取所有古道
exports.getRoads = async (req, res) => {
  try {
    const [roads] = await pool.query('SELECT * FROM roads')
    for (let road of roads) {
      const [bridges] = await pool.query(`
        SELECT b.* FROM bridges b
        JOIN road_bridge_relation r ON b.id = r.bridge_id
        WHERE r.road_id = ?
      `, [road.id])
      road.bridges = bridges
    }
    res.json(roads)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}

// 记录访问日志
exports.addLog = async (req, res) => {
  try {
    const { user_id, ip, action } = req.body
    await pool.query('INSERT INTO access_logs (user_id, ip, action) VALUES (?, ?, ?)', [user_id, ip, action])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
}