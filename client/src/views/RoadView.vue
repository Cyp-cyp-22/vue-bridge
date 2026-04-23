<template>
  <div class="road-view-container">
    <div class="page-header">
      <h1>古道与古桥网络</h1>
      <p>大数据·中国古代交通网络文化</p>
    </div>
    <div class="main-layout">
      <div class="left-section">
        <div class="view-switcher">
          <button class="switch-btn" :class="{ active: currentView === 'network' }" @click="switchTo('network')">
            网络关系图
          </button>
          <button class="switch-btn" :class="{ active: currentView === 'chart' }" @click="switchTo('chart')">
            数据统计图
          </button>
        </div>

        <div 
          v-show="currentView === 'network'" 
          ref="networkRef" 
          class="chart-box"
          :style="{ backgroundImage: currentBg }"
        ></div>

        <div v-show="currentView === 'chart'" ref="chartRef" class="chart-box"></div>
      </div>
      <div class="right-section">
        <div class="road-detail-card" v-if="selectedRoad">
          <div class="road-header">
            <h2>{{ selectedRoad.name }}</h2>
            <span>{{ selectedRoad.period || '古道' }}</span>
          </div>
          <p>{{ selectedRoad.description || '暂无介绍' }}</p>
          <div class="road-info-vertical">
            <div class="info-item"><label>起点</label><span>{{ selectedRoad.start || '未知' }}</span></div>
            <div class="info-item"><label>终点</label><span>{{ selectedRoad.end || '未知' }}</span></div>
            <div class="info-item"><label>全长</label><span>{{ selectedRoad.length || '未知' }}</span></div>
            <div class="info-item"><label>古桥</label><span>{{ (selectedRoad.bridges || []).length }} 座</span></div>
          </div>
        </div>
        <h3 v-if="selectedRoad">古桥详情</h3>
        <div class="bridge-scroll-box" v-if="selectedRoad">
          <div class="bridge-card" v-for="(b, idx) in selectedRoad.bridges" :key="idx">
            <div class="bridge-info">
              <h4>{{ b.name }}</h4>
              <div class="meta"><span>{{ b.dynasty }}</span><span>{{ b.type }}</span></div>
              <p>{{ b.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as d3 from 'd3'
import * as echarts from 'echarts'
import bridgeData from '@/assets/bridge_core.json'

const currentView = ref('network')
const roadsData = ref([])
const selectedRoad = ref(null)
const networkRef = ref(null)
const chartRef = ref(null)
const currentBg = ref('')

let chartInstance = null
let svg, svgWidth, svgHeight, cx, cy
let roadNodes, linkG, bridgeG
const ROAD_R = 24, BRIDGE_R = 7
const MIN_DIST = ROAD_R * 3
const BRIDGE_AVOID_DIST = 100
let lastCenterNode = null

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

watch(selectedRoad, (newRoad) => {
  if (!newRoad || !newRoad.name) {
    currentBg.value = "none"
    return
  }
  const img = roadImageMap[newRoad.name]
  currentBg.value = img ? `url(${img})` : "none"
})

onMounted(async () => {
  initData()
  await nextTick()
  renderCurrentChart()
  window.addEventListener('resize', renderCurrentChart)
})
onUnmounted(() => {
  window.removeEventListener('resize', renderCurrentChart)
  if (chartInstance) chartInstance.dispose()
})
watch(currentView, async () => {
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
  await nextTick()
  renderCurrentChart()
})

function switchTo(v) {
  currentView.value = v
}
function initData() {
  roadsData.value = bridgeData?.roads?.filter(r => r.name) || []
  if (roadsData.value.length) selectedRoad.value = roadsData.value[0]
}
function renderCurrentChart() {
  if (currentView.value === 'network') {
    renderD3Network()
  } else {
    renderBarChart()
  }
}
function renderBarChart() {
  if (!chartRef.value) return
  if (chartInstance) chartInstance.dispose()
  
  chartInstance = echarts.init(chartRef.value)
  const names = roadsData.value.map(d => d.name)
  const counts = roadsData.value.map(d => (d.bridges || []).length)
  
  const option = {
    backgroundColor: 'transparent',
    title: { text: '各古道古桥数量', left: 'center', textStyle: { fontSize: 18, color: '#5D4037' }},
    tooltip: { trigger: 'axis', axisPointer: { type:'shadow' }},
    grid: { left:'5%', right:'5%', top:'15%', bottom:'15%', containLabel:true },
    xAxis: { 
      type: 'category', 
      data: names, 
      axisLabel: { rotate: 30, fontSize:13, color: '#5D4037' }
    },
    yAxis: { type: 'value', axisLabel: { color: '#5D4037' } },
    series: [{
      data: counts, 
      type: 'bar', 
      itemStyle: { 
        borderRadius:6, 
        color: new echarts.graphic.LinearGradient(0,0,0,1,[
          {offset:0,color:'#8B4513'},{offset:1,color:'#CD853F'}
        ])
      },
      label: { show:true, position:'top', fontSize:12 }
    }]
  }
  
  chartInstance.setOption(option)
  chartInstance.off('click')
  chartInstance.on('click', (params) => {
    const index = params.dataIndex
    selectedRoad.value = roadsData.value[index]
  })
  setTimeout(() => chartInstance.resize(), 100)
}
function renderD3Network() {
  const el = networkRef.value
  if (!el) return
  el.innerHTML = ''
  
  const container = el.getBoundingClientRect()
  svgWidth = container.width
  svgHeight = container.height
  cx = svgWidth / 2
  cy = svgHeight / 2
  const colors = ['#4a90e2','#50c878','#f5a623','#d0021b','#9b59b6','#1abc9c','#ff6b6b']
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

  // ======================
  // 🔥 古道文字 + 白底
  // ======================
  roadNodes.each(function(d) {
    const g = d3.select(this)
    const text = g.append('text')
      .attr('dx', ROAD_R + 8)
      .attr('dy', 4)
      .attr('font-size', 13)
      .attr('fill', '#222')
      .text(d.name.length > 7 ? d.name.slice(0,7)+'...' : d.name)

    const bbox = text.node().getBBox()
    g.insert('rect', 'text')
      .attr('x', bbox.x - 3)
      .attr('y', bbox.y - 2)
      .attr('width', bbox.width + 6)
      .attr('height', bbox.height + 4)
      .attr('rx', 3)
      .attr('fill', 'rgba(255,255,255,0.9)')
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

    // ======================
    // 🔥 桥梁文字 + 白底
    // ======================
    bElem.each(function(d) {
      const g = d3.select(this)
      const text = g.append('text')
        .attr('dx', BRIDGE_R + 4)
        .attr('dy', 4)
        .attr('font-size', 12)
        .attr('fill', '#222')
        .attr('opacity', 0)
        .text(d.name.length>5 ? d.name.slice(0,5)+'...' : d.name)

      const bbox = text.node().getBBox()
      g.insert('rect', 'text')
        .attr('x', bbox.x - 2)
        .attr('y', bbox.y - 1)
        .attr('width', bbox.width + 4)
        .attr('height', bbox.height + 2)
        .attr('rx', 2)
        .attr('fill', 'rgba(255,255,255,0.9)')

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
</script>

<style scoped>
.road-view-container {
  width: 100%;
  height: calc(100vh - 60px);

  background-attachment: fixed;
  padding: 12px;
  margin-top: 60px;
  box-sizing: border-box;
  font-family: "Microsoft YaHei", sans-serif;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow: hidden;
}
.page-header {
  text-align: center;
  padding: 8px;
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  margin: 0;
}
.page-header h1 {
  font-size: 22px;
  color: #5D4037;
  margin: 0;
}
.page-header p {
  font-size: 13px;
  color: #5D4037;
  margin: 2px 0 0;
  opacity: 0.8;
}
.main-layout {
  display: flex;
  flex: 1;
  gap: 10px;
  height: 100%;
  overflow: hidden;
}
.left-section {
  width: 55%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
  overflow: hidden;
}
.right-section {
  width: 45%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  height: 100%;
  overflow: hidden;
}
.view-switcher {
  display: flex;
  gap: 8px;
  justify-content: center;
  flex-shrink: 0;
}
.switch-btn {
  padding: 6px 16px;
  border: none;
  border-radius: 8px;
  background: rgba(255,255,255,0.8);
  backdrop-filter: blur(8px);
  font-size: 14px;
  cursor: pointer;
  color: #5D4037;
}
.switch-btn.active {
  background: #8B4513;
  color: #fff;
}
.chart-box {
  flex: 1;
  width: 100%;
  height: 100%;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 2px solid rgba(139, 69, 19, 0.4);
  box-shadow: 0 0 0 1px rgba(139,69,19,0.2), 0 8px 32px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  box-sizing: border-box;
  background-size: cover !important;
  background-position: center !important;
  background-repeat: no-repeat !important;
}
.road-detail-card {
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(10px);
  padding: 12px;
  border-radius: 12px;
  border: 1px solid rgba(139,69,19,0.15);
  flex-shrink: 0;
}
.road-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.road-header h2 {
  font-size: 17px;
  margin: 0;
  color: #5D4037;
}
.road-header span {
  color: #8B4513;
  font-size: 14px;
}
.road-detail-card p {
  font-size: 13px;
  color: #5D4037;
  line-height: 1.5;
  margin-bottom: 8px;
}
.road-info-vertical {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.info-item {
  background: rgba(255,255,255,0.5);
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 13px;
  display: flex;
  justify-content: space-between;
  color: #5D4037;
}
.right-section h3 {
  font-size: 16px;
  color: #5D4037;
  margin: 0;
  flex-shrink: 0;
}
.bridge-scroll-box {
  flex: 1;
  overflow-y: auto;
  padding-right: 4px;
}
.bridge-scroll-box::-webkit-scrollbar { width: 4px; }
.bridge-scroll-box::-webkit-scrollbar-thumb { background: #ccc; border-radius: 4px; }
.bridge-card {
  background: #ffffff !important;
  backdrop-filter: blur(6px);
  padding: 8px;
  border-radius: 8px;
  margin-bottom: 6px;
}
.bridge-info h4 {
  font-size: 14px;
  margin: 0 0 4px;
  color: #5D4037;
}
.bridge-info .meta {
  display: flex;
  gap: 6px;
  margin-bottom: 4px;
}
.bridge-info .meta span {
  font-size: 12px;
  color: #8B4519;
  background: rgba(255,255,255,0.5);
  padding: 1px 6px;
  border-radius: 4px;
}
.bridge-info p {
  font-size: 12px;
  color: #5D4037;
  margin: 0;
  line-height: 1.4;
}
</style>