<template>
  <div class="page-ancient">
    <div class="header">
      <h1>古桥千秋 · 中国古代桥梁时空可视化</h1>
    </div>
    <div class="search-bar">
      <input v-model="searchText" placeholder="🔍 输入桥名或地区搜索" class="search-input" />
    </div>
    <div class="filter-bar">
      <div class="filter-item">
        <label>朝代：</label>
        <select v-model="filterDynasty">
          <option value="">全部</option>
          <option v-for="d in sortedDynastyOptions" :key="d" :value="d">{{ d }}</option>
        </select>
      </div>
      <div class="filter-item">
        <label>桥型：</label>
        <select v-model="filterType">
          <option value="">全部</option>
          <option v-for="t in types" :key="t" :value="t">{{ t }}</option>
        </select>
      </div>
    </div>
    <div class="content-layout">
      <div id="map" class="map-box"></div>
      <div class="right-panel">
        <div v-show="!selectedBridge" class="chart-container">
          <div ref="chart1Ref" class="chart-item"></div>
          <div ref="chart2Ref" class="chart-item"></div>
        </div>
        <div v-if="selectedBridge" class="detail-card">
          <div class="detail-top">
            <h2>{{ selectedBridge.name }}</h2>
            <button class="close-btn" @click="closeAll">×</button>
          </div>
          <div class="detail-image">
            <img
              v-if="selectedBridge.pic"
              :src="`/bridge-img/${selectedBridge.pic}`"
              alt="桥梁图片"
            />
            <div v-else class="no-image">暂无图片</div>
          </div>
          <div class="detail-content">
            <p><span>朝代</span>{{ selectedBridge.dynasty }}</p>
            <p><span>类型</span>{{ selectedBridge.type }}</p>
            <p><span>位置</span>{{ selectedBridge.address }}</p>
            <p class="desc"><span>简介</span>{{ selectedBridge.intro }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, nextTick, computed, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import * as echarts from 'echarts'
import bridgeData from '../assets/bridge_core.json'
const bridgeList = ref(bridgeData?.bridges || [])
const searchText = ref('')
const filterDynasty = ref('')
const filterType = ref('')
const selectedBridge = ref(null)
let map = null
let markers = []
let currentPopup = null
const chart1Ref = ref(null)
const chart2Ref = ref(null)
let chart1 = null
let chart2 = null
// ✅【绝对正确】中国朝代历史时间线（标准顺序）
const STANDARD_DYNASTY_ORDER = [
  '先秦',
  '春秋',
  '战国',
  '秦',
  '西汉',
  '东汉',
  '三国',
  '西晋',
  '东晋',
  '南北朝',
  '隋',
  '唐',
  '五代十国',
  '北宋',
  '南宋',
  '辽',
  '金',
  '元',
  '明',
  '清'
]
// 筛选下拉框也按历史顺序排列
const sortedDynastyOptions = computed(() => {
  const allDynasties = [...new Set(bridgeList.value.map(item => item.dynasty).filter(Boolean))]
  return allDynasties.sort((a, b) => {
    const i1 = STANDARD_DYNASTY_ORDER.indexOf(a)
    const i2 = STANDARD_DYNASTY_ORDER.indexOf(b)
    if (i1 === -1) return 1
    if (i2 === -1) return -1
    return i1 - i2
  })
})
const types = computed(() => {
  return [...new Set(bridgeList.value.map(item => item.type).filter(Boolean))]
})
const filteredData = computed(() => {
  return bridgeList.value.filter(item => {
    if (!item) return false
    const matchSearch =
      (item.name && item.name.includes(searchText.value)) ||
      (item.address && item.address.includes(searchText.value))
    const matchDynasty = !filterDynasty.value || item.dynasty === filterDynasty.value
    const matchType = !filterType.value || item.type === filterType.value
    return matchSearch && matchDynasty && matchType
  })
})
function initMap() {
  map = L.map('map').setView([35, 105], 4)
  L.tileLayer('https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}', {
    subdomains: ['1', '2', '3', '4'],
    attribution: '© 高德地图'
  }).addTo(map)
}
function renderMarkers() {
  if (!map) return
  markers.forEach(m => { map.removeLayer(m) })
  markers = []
  filteredData.value.forEach(item => {
    if (!item.lat || !item.lng) return
    const colorMap = {
      '拱桥': '#c0392b',
      '梁桥': '#2980b9',
      '索桥': '#27ae60',
      '浮桥': '#f39c12'
    }
    const bgColor = colorMap[item.type] || '#8B4513'
    const icon = L.divIcon({
      html: `<div style="width:14px;height:14px;background:${bgColor};border-radius:50%;border:2px solid #fff;"></div>`,
      className: ''
    })
    const marker = L.marker([item.lat, item.lng], { icon }).addTo(map)
    
    marker.on('mouseover', () => {
      if (currentPopup) map.closePopup(currentPopup)
      currentPopup = L.popup({
        closeButton: false,
        autoClose: false,
        closeOnClick: false,
        autoPan: false,
        offset: [0, -20],
        className: 'hover-popup'
      })
      .setLatLng([item.lat, item.lng])
      .setContent(`<b>${item.name}</b>`)
      .openOn(map)
    })
    
    marker.on('mouseout', () => {
      if (currentPopup) {
        map.closePopup(currentPopup)
        currentPopup = null
      }
    })
    
    marker.on('click', () => {
      selectedBridge.value = item
    })
    markers.push(marker)
  })
}
function initCharts() {
  chart1 = echarts.init(chart1Ref.value)
  chart2 = echarts.init(chart2Ref.value)
  // ✅ 核心：按【标准历史顺序】生成柱子，一个朝代一根，数据一一对应
  const dynastyCount = {}
  bridgeList.value.forEach(item => {
    if (item.dynasty) {
      dynastyCount[item.dynasty] = (dynastyCount[item.dynasty] || 0) + 1
    }
  })
  const xData = []
  const seriesData = []
  STANDARD_DYNASTY_ORDER.forEach(d => {
    if (dynastyCount[d] !== undefined) {
      xData.push(d)
      seriesData.push(dynastyCount[d])
    }
  })
  // 绘制柱状图：顺序100%正确 + 一一对应
  chart1.setOption({
    backgroundColor: 'transparent',
    title: { text: '各朝代桥梁数量', left: 'center', textStyle: { color: '#5D4037' } },
    xAxis: {
      type: 'category',
      data: xData,
      axisLabel: { rotate: 45, fontSize: 11, color: '#5D4037' }
    },
    yAxis: { type: 'value', axisLabel: { color: '#5D4037' } },
    series: [{
      data: seriesData,
      type: 'bar',
      itemStyle: { color: '#8B4513' }
    }],
    grid: { left: '10%', right: '10%', bottom: '15%' }
  })
  // 桥型饼图
  const typeCount = {}
  bridgeList.value.forEach(item => {
    if (item.type) typeCount[item.type] = (typeCount[item.type] || 0) + 1
  })
  chart2.setOption({
    backgroundColor: 'transparent',
    title: { text: '桥型占比', left: 'center', textStyle: { color: '#5D4037' } },
    series: [{
      data: Object.entries(typeCount).map(([name, value]) => ({ name, value })),
      type: 'pie',
      radius: ['40%', '70%'],
      itemStyle: {
        color: function(params) {
          const colors = ['#8B4513', '#A0522D', '#CD853F', '#D2691E', '#DEB887'];
          return colors[params.dataIndex % colors.length];
        }
      }
    }]
  })
}
function closeAll() {
  selectedBridge.value = null
  if (currentPopup) {
    map.closePopup(currentPopup)
    currentPopup = null
  }
}
watch(filteredData, () => {
  renderMarkers()
}, { deep: true })
onMounted(() => {
  nextTick(() => {
    initMap()
    initCharts()
    renderMarkers()
  })
})
</script>
<style scoped>
.page-ancient {
  width: 100%;
  height: calc(100vh - 60px);

  background-attachment: fixed;
  padding: 22px;
  margin-top: 60px;
  box-sizing: border-box;
  font-family: "Microsoft YaHei", sans-serif;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow: hidden;
}
.header h1 {
  text-align: center;
  font-size: 24px;
  color: #5D4037;
  padding: 12px;
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  margin: 0;
}
.search-bar {
  display: flex;
  justify-content: center;
}
.search-input {
  width: 480px;
  padding: 10px;
  border: 1px solid rgba(209, 200, 191, 0.6);
  border-radius: 8px;
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(8px);
  color: #5D4037;
}
.search-input::placeholder {
  color: rgba(93, 64, 55, 0.6);
}
.filter-bar {
  display: flex;
  justify-content: center;
  gap: 30px;
  padding: 8px 16px;
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(8px);
  border-radius: 12px;
  width: fit-content;
  margin: 0 auto;
}
.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #5D4037;
}
.filter-item select {
  background: rgba(255,255,255,0.6);
  border: 1px solid rgba(209, 200, 191, 0.6);
  border-radius: 6px;
  padding: 4px 8px;
  color: #5D4037;
}
.content-layout {
  display: flex;
  flex: 1;
  gap: 20px;
}
.map-box {
  flex: 7;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}
.right-panel {
  flex: 4;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}
.chart-container {
  height: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.chart-item {
  flex: 1;
}
.detail-card {
  height: 100%;
  padding: 24px;
  overflow-y: auto;
}
.detail-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.close-btn {
  font-size: 24px;
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
  transition: all 0.3s;
}
.close-btn:hover {
  color: #8B4513;
  transform: scale(1.1);
}
.detail-image {
  width: 100%;
  height: 220px;
  background: rgba(243, 243, 243, 0.5);
  border-radius: 8px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.detail-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}
.no-image {
  color: #aaa;
}
.detail-content p {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px dashed rgba(0,0,0,0.1);
}
.detail-content p span {
  color: #8B4513;
  font-weight: 500;
}
.hover-popup {
  pointer-events: none !important;
}
</style>
