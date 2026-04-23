const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();

// 关键：允许所有跨域请求
app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());

// 数据库配置
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'root123456', // 改成你自己的密码
  database: 'bridge_dashboard'
});

db.connect((err) => {
  if (err) {
    console.error('数据库连接失败:', err);
    return;
  }
  console.log('✅ 数据库连接成功');
});

// 大屏接口
app.get('/api/bridges', (req, res) => {
  db.query('SELECT * FROM bridges', (err, results) => {
    if (err) return res.json({ error: err.message });
    res.json(results);
  });
});

app.get('/api/roads', (req, res) => {
  db.query('SELECT * FROM roads', (err, results) => {
    if (err) return res.json({ error: err.message });
    res.json(results);
  });
});

app.get('/api/road-bridge-relations', (req, res) => {
  db.query('SELECT * FROM road_bridge_relation', (err, results) => {
    if (err) return res.json({ error: err.message });
    res.json(results);
  });
});

// 后台接口
app.get('/api/admin/bridges', (req, res) => {
  db.query('SELECT * FROM bridges', (err, results) => {
    if (err) return res.json({ error: err.message });
    res.json(results);
  });
});

app.get('/api/admin/roads', (req, res) => {
  // 一次性获取roads和relations，组装bridgeIds
  Promise.all([
    new Promise((resolve, reject) => db.query('SELECT * FROM roads', (err, results) => err ? reject(err) : resolve(results))),
    new Promise((resolve, reject) => db.query('SELECT * FROM road_bridge_relation', (err, results) => err ? reject(err) : resolve(results)))
  ]).then(([roads, relations]) => {
    // 给每个road加上bridgeIds
    const roadsWithBridgeIds = roads.map(road => {
      const roadRelations = relations.filter(r => r.road_id === road.id)
      const bridgeIds = roadRelations.map(rel => rel.bridge_id)
      return {
        ...road,
        bridgeIds: bridgeIds
      }
    })
    res.json(roadsWithBridgeIds);
  }).catch(err => {
    res.json({ error: err.message })
  })
});

// 增删改接口（保留）
app.post('/api/admin/bridges', (req, res) => {
  const { name, dynasty, type, address, intro, lat, lng } = req.body;
  const sql = `INSERT INTO bridges (name, dynasty, type, address, intro, lat, lng) VALUES (?, ?, ?, ?, ?, ?, ?)`;
  db.query(sql, [name, dynasty, type, address, intro, lat, lng], (err, result) => {
    if (err) return res.json({ error: err.message });
    res.json({ message: '新增成功', id: result.insertId });
  });
});

app.put('/api/admin/bridges/:id', (req, res) => {
  const { name, dynasty, type, address, intro, lat, lng } = req.body;
  const { id } = req.params;
  const sql = `UPDATE bridges SET name=?, dynasty=?, type=?, address=?, intro=?, lat=?, lng=? WHERE id=?`;
  db.query(sql, [name, dynasty, type, address, intro, lat, lng, id], (err) => {
    if (err) return res.json({ error: err.message });
    res.json({ message: '修改成功' });
  });
});

app.delete('/api/admin/bridges/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM road_bridge_relation WHERE bridge_id = ?', [id], (err) => {
    if (err) return res.json({ error: err.message });
    db.query('DELETE FROM bridges WHERE id = ?', [id], (err) => {
      if (err) return res.json({ error: err.message });
      res.json({ message: '删除成功' });
    });
  });
});

app.post('/api/admin/roads', (req, res) => {
  const { name, period, description, start_point, end_point, length, bridgeIds } = req.body;
  const roadSql = `INSERT INTO roads (name, period, description, start_point, end_point, length) VALUES (?, ?, ?, ?, ?, ?)`;
  db.query(roadSql, [name, period, description, start_point, end_point, length], (err, result) => {
    if (err) return res.json({ error: err.message });
    const roadId = result.insertId;
    if (bridgeIds && bridgeIds.length > 0) {
      const relValues = bridgeIds.map(bridgeId => [roadId, bridgeId]);
      const relSql = 'INSERT INTO road_bridge_relation (road_id, bridge_id) VALUES ?';
      db.query(relSql, [relValues], (err) => {
        if (err) return res.json({ error: err.message });
        res.json({ message: '新增成功', id: roadId });
      });
    } else {
      res.json({ message: '新增成功', id: roadId });
    }
  });
});

app.put('/api/admin/roads/:id', (req, res) => {
  const { name, period, description, start_point, end_point, length, bridgeIds } = req.body;
  const { id } = req.params;
  const roadSql = `UPDATE roads SET name=?, period=?, description=?, start_point=?, end_point=?, length=? WHERE id=?`;
  db.query(roadSql, [name, period, description, start_point, end_point, length, id], (err) => {
    if (err) return res.json({ error: err.message });
    db.query('DELETE FROM road_bridge_relation WHERE road_id = ?', [id], (err) => {
      if (err) return res.json({ error: err.message });
      if (bridgeIds && bridgeIds.length > 0) {
        const relValues = bridgeIds.map(bridgeId => [id, bridgeId]);
        const relSql = 'INSERT INTO road_bridge_relation (road_id, bridge_id) VALUES ?';
        db.query(relSql, [relValues], (err) => {
          if (err) return res.json({ error: err.message });
          res.json({ message: '修改成功' });
        });
      } else {
        res.json({ message: '修改成功' });
      }
    });
  });
});

app.delete('/api/admin/roads/:id', (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM road_bridge_relation WHERE road_id = ?', [id], (err) => {
    if (err) return res.json({ error: err.message });
    db.query('DELETE FROM roads WHERE id = ?', [id], (err) => {
      if (err) return res.json({ error: err.message });
      res.json({ message: '删除成功' });
    });
  });
});

// 前端Home页需要的统一数据接口
app.get('/api/bridge-data', (req, res) => {
  // 一次性获取所有需要的数据，组装成前端需要的格式
  Promise.all([
    new Promise((resolve, reject) => db.query('SELECT * FROM bridges', (err, results) => err ? reject(err) : resolve(results))),
    new Promise((resolve, reject) => db.query('SELECT * FROM roads', (err, results) => err ? reject(err) : resolve(results))),
    new Promise((resolve, reject) => db.query('SELECT * FROM road_bridge_relation', (err, results) => err ? reject(err) : resolve(results)))
  ]).then(([bridges, roads, relations]) => {
    // 组装roads的bridges关联数据
    const roadsWithBridges = roads.map(road => {
      const roadRelations = relations.filter(r => r.road_id === road.id)
      const roadBridges = roadRelations.map(rel => 
        bridges.find(b => b.id === rel.bridge_id)
      ).filter(Boolean)
      return {
        ...road,
        bridges: roadBridges
      }
    })
    res.json({
      bridges: bridges,
      roads: roadsWithBridges
    })
  }).catch(err => {
    res.json({ error: err.message })
  })
})

app.listen(3001, () => {
  console.log('✅ 后端服务运行在 http://localhost:3001');
});