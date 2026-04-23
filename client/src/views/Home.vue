<template>
  <div class="dashboard-container">
    <div class="header">
      <h1>桥贯古今——中国古代桥梁成就数据可视化平台</h1>
    </div>

    <div class="content">
      <div class="left-col">
        <div class="card">
          <h3>古道网络关系图</h3>
          <div ref="networkRef" class="network-chart" :style="{ backgroundImage: currentBg }"></div>
        </div>

        <div class="card">
          <h3>古道详情</h3>
          <div v-if="selectedRoad" class="road-detail">
            <div class="road-header">
              <h2>{{ selectedRoad.name }}</h2>
              <span class="period">{{ selectedRoad.period }}</span>
            </div>
            <p class="desc">{{ selectedRoad.description }}</p>
            <div class="road-info">
              <div class="info-item"><label>起点</label><span>{{ selectedRoad.start_point }}</span></div>
              <div class="info-item"><label>终点</label><span>{{ selectedRoad.end_point }}</span></div>
              <div class="info-item"><label>全长</label><span>{{ selectedRoad.length }}</span></div>
              <div class="info-item"><label>古桥</label><span>{{ (selectedRoad.bridges||[]).length }} 座</span></div>
            </div>
          </div>
          <div v-else class="empty-tip">点击左侧古道节点查看详情</div>
        </div>
      </div>

      <div class="middle-col">
        <div class="card map-card">
          <h3>全国古桥地理分布</h3>
          <div class="filter-bar">
            <div class="filter-group">
              <label>朝代筛选</label>
              <select v-model="filterDynasty" @change="renderMapMarkers">
                <option value="">全部朝代</option>
                <option v-for="d in dynastyOptions" :key="d" :value="d">{{ d }}</option>
              </select>
            </div>
            <div class="filter-group">
              <label>桥型筛选</label>
              <select v-model="filterType" @change="renderMapMarkers">
                <option value="">全部类型</option>
                <option v-for="t in typeOptions" :key="t" :value="t">{{ t }}</option>
              </select>
            </div>
            <div class="filter-group">
              <label>名称搜索</label>
              <input
                v-model="filterName"
                @input="renderMapMarkers"
                placeholder="输入桥梁名称..."
                class="search-input"
              />
            </div>
          </div>
          <div id="map" class="map-box"></div>
        </div>
      </div>

      <div class="right-col">
        <div class="stat-row">
          <div class="stat-card">
            <div class="num">{{ bridgeList.length }}</div>
            <div class="label">古桥总数</div>
          </div>
          <div class="stat-card">
            <div class="num">{{ roadsData.length }}</div>
            <div class="label">古道总数</div>
          </div>
        </div>
        <div class="card">
          <h3>数据统计</h3>
          <div ref="chart1Ref" class="chart-item"></div>
          <div ref="chart2Ref" class="chart-item"></div>
        </div>
        <div class="card">
          <h3>古桥列表</h3>
          <div class="bridge-list">
            <div
              v-for="(item, index) in currentBridgeList"
              :key="item.id"
              class="bridge-item"
              @click="jumpToBridgeOnMap(item, index)"
            >
              <img
                :src="`/bridge-img/${index + 1}.jpg`"
                :alt="item.name"
                class="bridge-img"
              />
              <div class="bridge-info">
                <span class="name">{{ item.name }}</span>
                <span class="dynasty">{{ item.dynasty }} · {{ item.type }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showModal" class="modal" @click="closeModal">
      <div class="modal-content" @click.stop>
        <img :src="currentImg" alt="" class="big-img" />
        <h2>{{ currentBridge.name }}</h2>
        <p><b>朝代：</b>{{ currentBridge.dynasty }}</p>
        <p><b>类型：</b>{{ currentBridge.type }}</p>
        <p><b>地址：</b>{{ currentBridge.address }}</p>
        <p><b>介绍：</b>{{ currentBridge.intro }}</p>
        <button class="close-btn" @click="closeModal">关闭</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick, computed } from 'vue'
import * as d3 from 'd3'
import * as echarts from 'echarts'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const STANDARD_ORDER = [
  '春秋', '战国', '秦', '西汉', '东汉','汉','吴',
  '三国', '西晋', '东晋','晋', '南北朝',
  '隋', '唐', '五代', '北宋', '南宋','宋',
  '辽', '金', '元', '明', '清', '民国'
]

const roadsData = ref([])
const bridgeList = ref([])
const selectedRoad = ref(null)
const currentBg = ref('')

const filterDynasty = ref('')
const filterType = ref('')
const filterName = ref('')

const networkRef = ref(null)
let svg, svgWidth, svgHeight, cx, cy
let roadNodes, linkG, bridgeG
const ROAD_R = 24, BRIDGE_R = 7
const MIN_DIST = ROAD_R * 3
const BRIDGE_AVOID_DIST = 100
let lastCenterNode = null

let map = null
let markers = []
let currentPopup = null
const chart1Ref = ref(null)
const chart2Ref = ref(null)
let chart1 = null
let chart2 = null

const showModal = ref(false)
const currentImg = ref('')
const currentBridge = ref({})

const roadImageMap = {
  "丝绸之路": "/bridge-img/sichouzhilu.jpg",
  "京杭古道": "/bridge-img/jinghang.jpg",
  "闽粤古道": "/bridge-img/minyue.jpg",
  "川藏古道": "/bridge-img/chuanzang.jpg",
  "茶马古道": "/bridge-img/chama.jpg",
  "蜀道（秦蜀古道）": "/bridge-img/shudao.jpg",
  "徽杭古道": "/bridge-img/huihang.jpg",
  "秦直道": "/bridge-img/qinzhidao.jpg",
  "唐蕃古道": "/bridge-img/tangfan.jpg"
}

const dynastyOptions = computed(() => {
  const dynSet = new Set()
  bridgeList.value.forEach(b => b.dynasty && dynSet.add(b.dynasty))
  
  return Array.from(dynSet).sort((a, b) => {
    let idxA = STANDARD_ORDER.findIndex(s => s.includes(a))
    let idxB = STANDARD_ORDER.findIndex(s => s.includes(b))
    
    if (idxA === -1) idxA = STANDARD_ORDER.length
    if (idxB === -1) idxB = STANDARD_ORDER.length
    
    return idxA - idxB
  })
})

const typeOptions = computed(() => {
  const typeSet = new Set()
  bridgeList.value.forEach(b => b.type && typeSet.add(b.type))
  return Array.from(typeSet).sort()
})

const currentBridgeList = computed(() => {
  let data = bridgeList.value
  
  if (selectedRoad.value) {
    const names = selectedRoad.value.bridges.map(b => b.name)
    data = data.filter(i => names.includes(i.name))
  }
  
  if (filterDynasty.value) {
    data = data.filter(i => i.dynasty === filterDynasty.value)
  }
  if (filterType.value) {
    data = data.filter(i => i.type === filterType.value)
  }
  if (filterName.value) {
    const keyword = filterName.value.toLowerCase()
    data = data.filter(i => i.name.toLowerCase().includes(keyword))
  }
  
  return data
})

watch(selectedRoad, async (newRoad) => {
  if (!newRoad || !newRoad.name) {
    currentBg.value = "none"
    return
  }
  const img = roadImageMap[newRoad.name]
  currentBg.value = img ? `url(${img})` : "none"
  await nextTick()
  renderMapMarkers()
})

onMounted(async () => {
  await initData()
  await nextTick()
  initRoadNetwork()
  initMap()
  initCharts()
  renderMapMarkers()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (chart1) chart1.dispose()
  if (chart2) chart2.dispose()
  if (map) map.remove()
})

function handleResize() {
  if (chart1) chart1.resize()
  if (chart2) chart2.resize()
  if (map) map.invalidateSize()
}

// ✅ 最终修复：从数据库加载数据，不转圈
async function initData() {
  try {
    const res = await fetch('http://localhost:3001/api/bridge-data')
    const bridgeData = await res.json()

    roadsData.value = bridgeData?.roads || []
    bridgeList.value = bridgeData?.bridges || []
    selectedRoad.value = null
  } catch (err) {
    console.error("获取数据失败", err)
  }
}

// 下面全部不变
function initRoadNetwork() {
  const el = networkRef.value
  if (!el) return
  el.innerHTML = ''
  
  const container = el.getBoundingClientRect()
  svgWidth = container.width
  svgHeight = container.height
  cx = svgWidth / 2
  cy = svgHeight / 2
  const colors = ['#42b983','#50c878','#f5a623','#d0021b','#9b59b6','#1abc9c','#ff6b6b']
  const roads = roadsData.value.filter(r => r.name)
  let bridgeNodes = []
  const nodes = roads.map((r, i) => ({
    id: 'r' + i, group: i, name: r.name, data: r,
    x: 80 + Math.random() * (svgWidth - 160),
    y: 80 + Math.random() * (svgHeight - 160),
    originX: 0, originY: 0,
    vx: (Math.random() - 0.5) * 0.10,
    vy: (Math.random() - 0.5) * 0.10,
    fixed: false, returning: false
  }))
  nodes.forEach(n => { n.originX = n.x; n.originY = n.y })
  svg = d3.select(el).append('svg')
    .attr('width', svgWidth)
    .attr('height', svgHeight)
    .style('background','transparent')
  
  linkG = svg.append('g')
  bridgeG = svg.append('g')
  const roadG = svg.append('g')
  roadNodes = roadG.selectAll('g').data(nodes).enter()
    .append('g')
    .attr('transform', d => `translate(${d.x},${d.y})`)
  roadNodes.append('circle')
    .attr('r', ROAD_R)
    .attr('fill', d => colors[d.group % colors.length])
    .attr('stroke','#fff')
    .attr('stroke-width',2)
    .style('cursor','pointer')

  roadNodes.each(function(d) {
    const g = d3.select(this)
    const text = g.append('text')
      .attr('dx', ROAD_R + 8)
      .attr('dy', 4)
      .attr('font-size', 13)
      .attr('fill', '#fff')
      .text(d.name.length > 7 ? d.name.slice(0,7)+'...' : d.name)
    const bbox = text.node().getBBox()
    g.insert('rect', 'text')
      .attr('x', bbox.x - 3)
      .attr('y', bbox.y - 2)
      .attr('width', bbox.width + 6)
      .attr('height', bbox.height + 4)
      .attr('rx', 3)
      .attr('fill', 'rgba(0,0,0,0.7)')
  })

  d3.timer(() => {
    nodes.forEach(d => {
      if (d.fixed || d.returning) return
      d.x += d.vx
      d.y += d.vy
      const padding = 40
      if (d.x < padding) { d.x = padding; d.vx *= -1 }
      if (d.x > svgWidth - padding) { d.x = svgWidth - padding; d.vx *= -1 }
      if (d.y < padding) { d.y = padding; d.vy *= -1 }
      if (d.y > svgHeight - padding) { d.y = svgHeight - padding; d.vy *= -1 }
      nodes.forEach(n => {
        if (d === n) return
        const dx = d.x - n.x
        const dy = d.y - n.y
        const dist = Math.hypot(dx, dy)
        if (dist < MIN_DIST && dist > 0) {
          const f = (MIN_DIST - dist) / dist * 0.22
          d.x += dx * f
          d.y += dy * f
        }
      })
      bridgeNodes.forEach(b => {
        const dx = d.x - b.x
        const dy = d.y - b.y
        const dist = Math.hypot(dx, dy)
        if (dist < BRIDGE_AVOID_DIST && dist > 0) {
          const f = (BRIDGE_AVOID_DIST - dist) / dist * 0.25
          d.x += dx * f
          d.y += dy * f
        }
      })
    })
    roadNodes.attr('transform', d => `translate(${d.x},${d.y})`)
  })

  roadNodes.on('click', (e, centerNode) => {
    if (selectedRoad.value && selectedRoad.value.name === centerNode.data.name) {
      selectedRoad.value = null
      currentBg.value = 'none'
      linkG.selectAll('*').remove()
      bridgeG.selectAll('*').remove()
      bridgeNodes = []
      nodes.forEach(n => {
        n.returning = true
        d3.select(roadNodes.nodes()[n.id.slice(1)])
          .transition().duration(800)
          .attr('transform', `translate(${n.originX},${n.originY})`)
          .on('end', () => {
            n.x = n.originX
            n.y = n.originY
            n.returning = false
            n.fixed = false
          })
      })
      lastCenterNode = null
      renderMapMarkers()
      return
    }

    selectedRoad.value = centerNode.data
    linkG.selectAll('*').remove()
    bridgeG.selectAll('*').remove()
    bridgeNodes = []
    if (lastCenterNode && lastCenterNode !== centerNode) {
      const node = lastCenterNode
      node.returning = true
      d3.select(roadNodes.nodes()[node.id.slice(1)])
        .transition().duration(800).ease(d3.easeCubicOut)
        .attr('transform', `translate(${node.originX},${node.originY})`)
        .on('end', () => {
          node.x = node.originX
          node.y = node.originY
          node.returning = false
          node.fixed = false
        })
    }
    nodes.forEach(n => n.fixed = false)
    centerNode.fixed = true
    lastCenterNode = centerNode
    roadNodes.filter(d => d === centerNode)
      .transition().duration(900).ease(d3.easeCubicInOut)
      .attr('transform', `translate(${cx},${cy})`)
      .on('end', () => {
        centerNode.x = cx
        centerNode.y = cy
        createBridges(centerNode, colors)
      })
  })

  function createBridges(centerNode, colors) {
    const bridges = centerNode.data.bridges || []
    if (!bridges.length) return
    bridgeNodes = bridges.map((b, i) => ({
      name: b.name,
      angle: (i / bridges.length) * Math.PI * 2 + Math.random() * 0.3,
      maxRadius: 50 + Math.random() * 40,
      speed: 0.0007,
      x: cx, y: cy
    }))
    const lines = linkG.selectAll('line')
      .data(bridgeNodes).enter().append('line')
      .attr('stroke','#999').attr('stroke-width',1.5)
      .attr('x1',cx).attr('y1',cy).attr('x2',cx).attr('y2',cy)
    lines.transition().duration(1100).ease(d3.easeQuadOut)
      .attrTween('x2', d => t => { d.x = cx + d.maxRadius*t*Math.cos(d.angle); return d.x })
      .attrTween('y2', d => t => { d.y = cy + d.maxRadius*t*Math.sin(d.angle); return d.y })

    const bElem = bridgeG.selectAll('g').data(bridgeNodes).enter()
      .append('g').attr('transform', d => `translate(${d.x},${d.y})`)
    bElem.append('circle')
      .attr('r', BRIDGE_R)
      .attr('fill', colors[centerNode.group % colors.length])
      .attr('stroke','#fff').attr('stroke-width',2)

    bElem.each(function(d) {
      const g = d3.select(this)
      const text = g.append('text')
        .attr('dx', BRIDGE_R + 4)
        .attr('dy', 4)
        .attr('font-size', 12)
        .attr('fill', '#fff')
        .attr('opacity', 0)
        .text(d.name.length>5 ? d.name.slice(0,5)+'...' : d.name)
      const bbox = text.node().getBBox()
      g.insert('rect', 'text')
        .attr('x', bbox.x - 2)
        .attr('y', bbox.y - 1)
        .attr('width', bbox.width + 4)
        .attr('height', bbox.height + 2)
        .attr('rx', 2)
        .attr('fill', 'rgba(0,0,0,0.7)')
      setTimeout(() => {
        text.transition().duration(300).attr('opacity',1)
      }, 1100)
    })

    setTimeout(() => {
      d3.interval(() => {
        bridgeNodes.forEach(d => {
          d.angle += d.speed
          d.x = cx + d.maxRadius * Math.cos(d.angle)
          d.y = cy + d.maxRadius * Math.sin(d.angle)
        })
        linkG.selectAll('line')
          .attr('x1',cx).attr('y1',cy)
          .attr('x2',d=>d.x).attr('y2',d=>d.y)
        bElem.attr('transform',d=>`translate(${d.x},${d.y})`)
      },24)
    }, 1100)
  }
}

function initMap() {
  map = L.map('map').setView([35, 105], 4)
  L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
    subdomains: ['1', '2', '3', '4'],
    attribution: '© 高德地图'
  }).addTo(map)
}

function renderMapMarkers() {
  if (!map) return
  markers.forEach(m => { map.removeLayer(m) })
  markers = []
  
  let data = [...bridgeList.value]

  if (filterDynasty.value) {
    data = data.filter(i => i.dynasty === filterDynasty.value)
  }
  if (filterType.value) {
    data = data.filter(i => i.type === filterType.value)
  }
  if (filterName.value) {
    const keyword = filterName.value.toLowerCase()
    data = data.filter(i => i.name.toLowerCase().includes(keyword))
  }
  if (selectedRoad.value) {
    const names = selectedRoad.value.bridges.map(b => b.name)
    data = data.filter(i => names.includes(i.name))
  }

  data.forEach(item => {
    if (!item.lat || !item.lng) return
    const colorMap = {
      '拱桥': '#c0392b', '梁桥': '#2980b9', '索桥': '#27ae60', '浮桥': '#f39c12'
    }
    const bgColor = colorMap[item.type] || '#42b983'
    
    const icon = L.divIcon({
  html: `<div style="width:14px;height:14px;background:${bgColor};border-radius:50%;border:2px solid #fff;"></div>`,
  className: ''
})
    const marker = L.marker([item.lat, item.lng], { icon }).addTo(map)
    
    marker.on('mouseover', () => {
      if (currentPopup) map.closePopup(currentPopup)
      currentPopup = L.popup({
        closeButton: false, autoClose: false, closeOnClick: false, autoPan: false, offset: [0, -20]
      }).setLatLng([item.lat, item.lng]).setContent(`<b>${item.name}</b>`).openOn(map)
    })
    
    marker.on('mouseout', () => {
      if (currentPopup) { map.closePopup(currentPopup); currentPopup = null }
    })
    
    marker.on('click', () => { openBridgeDetail(item) })
    markers.push(marker)
  })
}

function initCharts() {
  if (!chart1Ref.value || !chart2Ref.value) return
  chart1 = echarts.init(chart1Ref.value)
  chart2 = echarts.init(chart2Ref.value)
  
  const dynastyCount = {}
  bridgeList.value.forEach(item => {
    if (item.dynasty) dynastyCount[item.dynasty] = (dynastyCount[item.dynasty] || 0) + 1
  })
  const xData = []
  const seriesData = []
  dynastyOptions.value.forEach(d => {
    if (dynastyCount[d]) {
      xData.push(d)
      seriesData.push(dynastyCount[d])
    }
  })
  chart1.setOption({
    backgroundColor: 'transparent',
    title: {
      text: '各朝代桥梁数量',
      left: 'center',
      textStyle: { color: '#42b983', fontSize: 16, fontWeight: 'bold' }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(0,0,0,0.8)',
      borderColor: '#42b983',
      textStyle: { color: '#fff' }
    },
    xAxis: {
      type: 'category',
      data: xData,
      axisLabel: {
        rotate: 45,
        fontSize: 12,
        color: '#ccc'
      },
      axisLine: { lineStyle: { color: '#333' } }
    },
    yAxis: {
      type: 'value',
      axisLabel: { fontSize: 12, color: '#ccc' },
      axisLine: { lineStyle: { color: '#333' } },
      splitLine: { lineStyle: { color: 'rgba(66, 185, 131, 0.15)' } }
    },
    series: [{
      data: seriesData,
      type: 'bar',
      barWidth: '60%',
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#42b983' },
          { offset: 1, color: '#22865a' }
        ]),
        borderRadius: [4, 4, 0, 0]
      }
    }],
    grid: {
      left: '12%',
      right: '8%',
      bottom: '25%',
      top: '20%'
    }
  })
  
  const typeCount = {}
  bridgeList.value.forEach(item => {
    if (item.type) typeCount[item.type] = (typeCount[item.type] || 0) + 1
  })
  const pieData = Object.entries(typeCount).map(([name, value]) => ({ name, value }))
  chart2.setOption({
    backgroundColor: 'transparent',
    title: {
      text: '桥型占比',
      left: 'center',
      textStyle: { color: '#42b983', fontSize: 16, fontWeight: 'bold' }
    },
    tooltip: { trigger: 'item' },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      textStyle: { color: '#ccc', fontSize: 12 }
    },
    series: [{
      data: pieData,
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['50%', '45%'],
      label: {
        show: true,
        fontSize: 12,
        color: '#fff'
      },
      itemStyle: {
        color: params => {
          const colors = ['#42b983', '#50c878', '#f5a623', '#d0021b', '#9b59b6', '#3498db']
          return colors[params.dataIndex % colors.length]
        },
        borderColor: '#0a1229',
        borderWidth: 2
      }
    }]
  })
}

function jumpToBridgeOnMap(bridge, index) {
  const fullBridge = bridgeList.value.find(b => b.name === bridge.name)
  if (fullBridge && fullBridge.lat && fullBridge.lng) {
    map.setView([fullBridge.lat, fullBridge.lng], 10)
    markers.forEach(marker => {
      const latlng = marker.getLatLng()
      if (latlng.lat === fullBridge.lat && latlng.lng === fullBridge.lng) marker.fire('click')
    })
  }
}

function openBridgeDetail(bridge) {
  const index = bridgeList.value.indexOf(bridge)
  currentBridge.value = bridge
  currentImg.value = `/bridge-img/${index + 1}.jpg`
  showModal.value = true
}

function closeModal() {
  showModal.value = false
}
</script>

<style scoped>
.dashboard-container {
  width: 100vw;
  height: 100vh;
  background: #0a1229;
  color: #fff;
  padding: 20px;
  box-sizing: border-box;
  overflow: hidden;
}

.header {
  text-align: center;
  margin-bottom: 20px;
}

.header h1 {
  font-size: 28px;
  color: #42b983;
  margin: 0;
}

.content {
  display: flex;
  gap: 20px;
  height: calc(100% - 60px);
}

.left-col {
  width: 25%;
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
}

.middle-col {
  flex: 1;
  height: 100%;
}

.right-col {
  width: 25%;
  display: flex;
  flex-direction: column;
  gap: 20px;
  height: 100%;
  overflow-y: auto;
}

.right-col::-webkit-scrollbar {
  width: 4px;
}
.right-col::-webkit-scrollbar-thumb {
  background: #42b983;
  border-radius: 2px;
}

.card {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 15px;
  flex-shrink: 0;
}

.card h3 {
  margin: 0 0 10px 0;
  font-size: 16px;
  color: #42b983;
}

.filter-bar {
  display: flex;
  gap: 20px;
  margin-bottom: 12px;
  align-items: center;
}
.filter-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.filter-group label {
  font-size: 13px;
  color: #ccc;
}
.filter-group select {
  appearance: none;
  padding: 8px 12px;
  border-radius: 6px;
  background: #151b33;
  border: 1px solid #2a3252;
  color: #fff;
  font-size: 14px;
  min-width: 130px;
  cursor: pointer;
}
.filter-group select:focus {
  outline: none;
  border-color: #42b983;
}
.search-input {
  padding: 8px 12px;
  border-radius: 6px;
  background: #151b33;
  border: 1px solid #2a3252;
  color: #fff;
  font-size: 14px;
  min-width: 150px;
  outline: none;
}
.search-input:focus {
  border-color: #42b983;
}
.search-input::placeholder {
  color: #666;
}

.network-chart {
  width: 100%;
  height: 280px;
  border-radius: 6px;
  overflow: hidden;
  background-size: cover;
  background-position: center;
}

.road-detail .road-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.road-detail .road-header h2 {
  font-size: 18px;
  margin: 0;
  color: #fff;
}
.road-detail .period {
  color: #42b983;
  font-size: 14px;
}
.road-detail .desc {
  font-size: 13px;
  color: #999;
  line-height: 1.5;
  margin-bottom: 10px;
}
.road-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.info-item {
  display: flex;
  justify-content: space-between;
  padding: 6px 10px;
  background: rgba(255,255,255,0.05);
  border-radius: 4px;
  font-size: 13px;
}
.info-item label {
  color: #999;
}
.info-item span {
  color: #42b983;
}
.empty-tip {
  text-align: center;
  padding: 30px 0;
  color: #666;
}

.map-card {
  height: 100%;
  padding: 15px;
}
.map-box {
  width: 100%;
  height: calc(100% - 80px);
  border-radius: 6px;
  overflow: hidden;
}

.stat-row {
  display: flex;
  gap: 10px;
}
.stat-card {
  flex: 1;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 8px;
  padding: 20px;
  text-align: center;
}
.stat-card .num {
  font-size: 36px;
  font-weight: bold;
  color: #42b983;
}
.stat-card .label {
  font-size: 14px;
  color: #999;
  margin-top: 4px;
}

.chart-item {
  height: 180px;
  width: 100%;
}

.bridge-list {
  max-height: 200px;
  overflow-y: auto;
}
.bridge-list::-webkit-scrollbar {
  width: 4px;
}
.bridge-list::-webkit-scrollbar-thumb {
  background: #42b983;
  border-radius: 2px;
}
.bridge-item {
  display: flex;
  gap: 10px;
  padding: 10px;
  background: rgba(255,255,255,0.05);
  border-radius: 6px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: 0.2s;
}
.bridge-item:hover {
  background: rgba(255,255,255,0.1);
}
.bridge-img {
  width: 50px;
  height: 50px;
  object-fit: cover;
  border-radius: 4px;
}
.bridge-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.bridge-info .name {
  font-size: 14px;
  font-weight: bold;
  color: #fff;
}
.bridge-info .dynasty {
  font-size: 12px;
  color: #42b983;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}
.modal-content {
  background: #111;
  padding: 30px;
  border-radius: 12px;
  width: 600px;
  text-align: center;
  color: white;
  border: 1px solid #42b983;
}
.big-img {
  width: 100%;
  max-height: 350px;
  object-fit: contain;
  margin-bottom: 20px;
}
.close-btn {
  margin-top: 20px;
  padding: 10px 20px;
  background: #42b983;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}
</style>