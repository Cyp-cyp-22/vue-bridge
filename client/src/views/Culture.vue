<template>
  <div class="culture-page">
    <!-- 顶部标题 -->
    <div class="page-head">
      <h2>🌉 古桥文化与类型</h2>
      <p>诗词意境 · 建筑类型 · 民俗寓意 · 精神象征</p>
    </div>
    <!-- 交互切换标签 -->
    <div class="tab-bar">
      <button 
        v-for="tab in tabs" 
        :key="tab.key"
        class="tab-btn"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key">
        {{ tab.label }}
      </button>
    </div>
    <!-- 内容容器：一屏、不滚动 -->
    <div class="panel-container">
      <!-- 1. 桥梁类型（卡片+图片+交互） -->
      <div v-show="activeTab === 'type'" class="panel">
        <div class="type-grid">
          <div 
            v-for="(item, idx) in bridgeTypes" 
            :key="idx"
            class="type-card"
            @mouseenter="hoverIdx = idx"
            @mouseleave="hoverIdx = null">
            <!-- 桥图片：使用 bridge-img 下的真实照片，修正路径 -->
            <div class="bridge-img">
              <img :src="item.img" :alt="item.name" />
            </div>
            <h3>{{ item.name }}</h3>
            <p class="short">{{ item.short }}</p>
            <div class="hover-info" :class="{ show: hoverIdx === idx }">
              {{ item.desc }}
            </div>
          </div>
        </div>
      </div>
      <!-- 2. 桥与诗词（卡片+诗词意境） -->
      <div v-show="activeTab === 'poem'" class="panel">
        <div class="poem-grid">
          <div v-for="(item, idx) in poemList" :key="idx" class="poem-card">
            <h4>{{ item.title }}</h4>
            <p class="poem">{{ item.poem }}</p>
            <p class="author">{{ item.author }}</p>
            <p class="note">{{ item.note }}</p>
          </div>
        </div>
      </div>
      <!-- 3. 文化寓意（风水/民俗/精神） -->
      <div v-show="activeTab === 'culture'" class="panel">
        <div class="culture-grid">
          <div v-for="(item, idx) in cultureMean" :key="idx" class="culture-card">
            <h3>{{ item.title }}</h3>
            <p>{{ item.desc }}</p>
            <div class="sub-list">
              <div v-for="(s, si) in item.list" :key="si" class="sub-item">
                ✅ {{ s }}
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- 4. 地域特色（已重构：多地域+数据可视化+联动交互） -->
      <div v-show="activeTab === 'region'" class="panel">
        <div class="region-container">
          <!-- 左侧地域列表 -->
          <div class="region-list">
            <div 
              v-for="(item, idx) in regionList" 
              :key="idx"
              class="region-item"
              @mouseenter="handleRegionHover(idx)"
              @mouseleave="handleRegionLeave()">
              <div class="region-item-img">
                <img :src="item.img" :alt="item.name" />
              </div>
              <div class="region-item-content">
                <h4>{{ item.name }}</h4>
                <p class="region-item-desc">{{ item.short }}</p>
                <div class="region-item-features">
                  <span v-for="f in item.features" :key="f">{{ f }}</span>
                </div>
              </div>
            </div>
          </div>
          <!-- 右侧数据图表 -->
          <div class="region-chart-wrapper">
            <h4 class="chart-title" ref="chartTitleRef">📊 全国主要省份古桥数量分布</h4>
            <div ref="regionChartRef" class="region-chart"></div>
            <p class="chart-note" ref="chartNoteRef">数据来源：全国第三次文物普查古桥遗存统计</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
// 标签切换
const activeTab = ref('type')
const tabs = [
  { key: 'type', label: '🏗️ 桥梁类型' },
  { key: 'poem', label: '📜 桥与诗词' },
  { key: 'culture', label: '🎭 文化寓意' },
  { key: 'region', label: '🗺️ 地域特色' },
]
// 1. 桥梁类型
const hoverIdx = ref(null)
const bridgeTypes = [
  {
    name: '石拱桥',
    short: '曲线优美，承载力最强',
    desc: '中国古桥最高成就，以拱券承重，跨度大、造型美、寿命长，代表赵州桥、卢沟桥。',
    img: '/bridge-img/zhaozhou.jpg'
  },
  {
    name: '石梁桥',
    short: '平直坚固，最古老主流',
    desc: '以石梁为主体，结构简单、建造最广，代表洛阳桥、安平桥。',
    img: '/bridge-img/luoyang.jpg'
  },
  {
    name: '索桥/吊桥',
    short: '跨越天险，无墩跨江',
    desc: '以竹索、铁索悬挂而成，适合峡谷急流，代表泸定桥。',
    img: '/bridge-img/luding.jpg'
  },
  {
    name: '浮桥',
    short: '船筏拼接，可拆可合',
    desc: '以船只连接，架设快、适合宽江与军事用途。',
    img: '/bridge-img/float.jpg'
  },
  {
    name: '廊桥/屋桥',
    short: '遮风挡雨，兼具休憩',
    desc: '桥上建廊，保护木构、供人休憩，泰顺廊桥为代表。',
    img: '/bridge-img/covered.jpg'
  },
  {
    name: '跨海大桥',
    short: '古代超级工程',
    desc: '建于江海交汇处，采用筏基、固基技术，代表洛阳桥、安平桥。',
    img: '/bridge-img/anping.jpg'
  }
]
// 2. 桥与诗词
const poemList = [
  {
    title: '枫桥夜泊',
    poem: '月落乌啼霜满天，江枫渔火对愁眠。姑苏城外寒山寺，夜半钟声到客船。',
    author: '唐 · 张继',
    note: '枫桥：苏州古桥，中国最具诗名的桥'
  },
  {
    title: '寄扬州韩绰判官',
    poem: '青山隐隐水迢迢，秋尽江南草未凋。二十四桥明月夜，玉人何处教吹箫。',
    author: '唐 · 杜牧',
    note: '二十四桥：扬州象征，诗中绝唱'
  },
  {
    title: '乌衣巷',
    poem: '朱雀桥边野草花，乌衣巷口夕阳斜。旧时王谢堂前燕，飞入寻常百姓家。',
    author: '唐 · 刘禹锡',
    note: '朱雀桥：南京六朝古桥，历史沧桑'
  },
  {
    title: '古桥谚语',
    poem: '桥跨东西两岸，路通南北千村。一桥飞架变通途，古今多少事。',
    author: '民间谚语',
    note: '桥是连接、沟通、团圆的象征'
  }
]
// 3. 文化寓意
const cultureMean = [
  {
    title: '🌉 沟通与连接',
    desc: '桥象征连接、沟通、团圆、跨越阻碍',
    list: ['连接两岸', '通达四方', '人际和谐', '家国团圆']
  },
  {
    title: '🎋 风水与吉祥',
    desc: '古桥在风水里为“水口关拦”，聚气旺财',
    list: ['锁住财气', '镇水辟邪', '保佑平安', '风调雨顺']
  },
  {
    title: '📜 礼仪与教化',
    desc: '桥是道德、礼仪、文化教化的载体',
    list: ['修桥铺路，积德行善', '桥记碑文，传承历史', '文人题咏，提升文化']
  },
  {
    title: '🕊️ 生命与超越',
    desc: '桥象征跨越生死、超越苦难、走向希望',
    list: ['鹊桥相会：爱情', '断桥残雪：坚韧', '彩虹桥：吉祥']
  }
]

// -------------------------- 地域特色重构部分 --------------------------
// 地域列表数据
const regionList = [
  {
    name: '江南水乡',
    short: '小桥流水，诗画意境',
    features: ['石拱为主', '婉约小巧', '多孔联桥'],
    img: '/bridge-img/2.jpg',
    // 桥型占比数据
    typeData: {
      names: ['石梁桥', '石拱桥', '廊桥', '其他'],
      values: [60, 30, 5, 5]
    }
  },
  {
    name: '华北平原',
    short: '雄浑大气，坚固实用',
    features: ['联拱石桥', '平直厚重', '抗洪防冰'],
    img: '/bridge-img/lugou.jpg',
    typeData: {
      names: ['石梁桥', '联拱石桥', '浮桥', '其他'],
      values: [60, 25, 5, 10]
    }
  },
  {
    name: '闽浙沿海',
    short: '跨海工程，廊桥技艺',
    features: ['跨海梁桥', '木拱廊桥', '生物固基'],
    img: '/bridge-img/anping.jpg',
    typeData: {
      names: ['石梁桥', '廊桥', '石拱桥', '其他'],
      values: [40, 35, 20, 5]
    }
  },
  {
    name: '西南山区',
    short: '跨越天险，民族特色',
    features: ['索桥', '风雨桥', '榫卯木构'],
    img: '/bridge-img/6.jpg',
    typeData: {
      names: ['风雨桥', '索桥', '石拱桥', '其他'],
      values: [65, 15, 10, 10]
    }
  }
]

// 全国省份古桥数量默认数据
const provinceData = {
  categories: ['浙江', '福建', '湖南', '四川', '江苏', '河北'],
  values: [1200, 900, 600, 550, 450, 250]
}

// 图表相关ref
const regionChartRef = ref(null)
const chartTitleRef = ref(null)
const chartNoteRef = ref(null)
let regionChart = null

// 渲染省份柱状图
const renderBarChart = () => {
  if (!regionChart) return
  if (chartTitleRef.value) {
    chartTitleRef.value.innerText = '📊 全国主要省份古桥数量分布'
  }
  if (chartNoteRef.value) {
    chartNoteRef.value.innerText = '数据来源：您提供的核心古桥数据统计'
  }
  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: provinceData.categories,
      axisLine: {
        lineStyle: {
          color: '#5D4037'
        }
      },
      axisLabel: {
        color: '#5D4037'
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        lineStyle: {
          color: '#5D4037'
        }
      },
      axisLabel: {
        color: '#5D4037'
      },
      splitLine: {
        lineStyle: {
          type: 'dashed',
          color: 'rgba(93, 64, 55, 0.1)'
        }
      }
    },
    series: [
      {
        name: '古桥数量',
        type: 'bar',
        data: provinceData.values,
        itemStyle: {
          color: '#d2b48c',
          borderRadius: [4, 4, 0, 0]
        },
        emphasis: {
          itemStyle: {
            color: '#8B4513'
          }
        },
        barWidth: '60%'
      }
    ]
  }
  regionChart.setOption(option, true)
}

// 渲染地域桥型饼图
const renderPieChart = (idx) => {
  if (!regionChart) return
  const region = regionList[idx]
  if (chartTitleRef.value) {
    chartTitleRef.value.innerText = `📊 ${region.name}古桥类型占比`
  }
  if (chartNoteRef.value) {
    chartNoteRef.value.innerText = `该地域不同桥型的分布比例，体现因地制宜的营造智慧`
  }
  const option = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      textStyle: {
        color: '#5D4037'
      }
    },
    series: [
      {
        name: '桥型占比',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold',
            color: '#5D4037'
          }
        },
        labelLine: {
          show: false
        },
        data: region.typeData.names.map((name, i) => ({
          value: region.typeData.values[i],
          name: name,
          itemStyle: {
            color: ['#d2b48c', '#8B4513', '#a0522d', '#cd853f'][i]
          }
        }))
      }
    ]
  }
  regionChart.setOption(option, true)
}

// 初始化图表
const initRegionChart = () => {
  if (!regionChartRef.value) return
  regionChart = echarts.init(regionChartRef.value)
  // 默认显示省份柱状图
  renderBarChart()
  // 响应式适配
  window.addEventListener('resize', () => {
    regionChart?.resize()
  })
}

// 地域hover交互：切换图表
const handleRegionHover = (idx) => {
  renderPieChart(idx)
}

// 鼠标离开：恢复默认柱状图
const handleRegionLeave = () => {
  renderBarChart()
}

// 生命周期：监听标签切换，初始化图表
onMounted(() => {
  if (activeTab.value === 'region') {
    nextTick(() => initRegionChart())
  }
})

watch(activeTab, (val) => {
  if (val === 'region' && !regionChart) {
    nextTick(() => initRegionChart())
  }
})
</script>
<style scoped>
/* 整页：一屏、不滚动 */
.culture-page {
  width: 100%;
  height: 100vh;
  margin-top: 60px;

  background-attachment: fixed;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
/* 头部 */
.page-head {
  padding: 18px 20px;
  text-align: center;
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}
.page-head h2 {
  margin: 0;
  font-size: 24px;
  color: #5D4037;
}
.page-head p {
  margin: 4px 0 0;
  font-size: 13px;
  color: rgba(93, 64, 55, 0.7);
}
/* 标签栏 */
.tab-bar {
  display: flex;
  justify-content: center;
  gap: 10px;
  padding: 12px 20px;
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid rgba(234, 238, 245, 0.5);
}
.tab-btn {
  padding: 8px 14px;
  border: none;
  border-radius: 8px;
  background: rgba(245, 247, 250, 0.6);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  color: #5D4037;
}
.tab-btn:hover {
  transform: translateY(-2px);
}
.tab-btn.active {
  background: #8B4513;
  color: #fff;
}
/* 面板容器：一屏高度 */
.panel-container {
  flex: 1;
  position: relative;
  padding: 20px;
}
.panel {
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  bottom: 20px;
}
/* =============== 1. 桥梁类型 =============== */
.type-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  height: 100%;
}
.type-card {
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(8px);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  position: relative;
  overflow: hidden;
  transition: all 0.3s;
}
.type-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}
.bridge-img {
  width: 100%;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 12px;
}
.bridge-img img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: 0.3s;
}
.type-card:hover .bridge-img img {
  transform: scale(1.05);
}
.type-card h3 {
  font-size: 16px;
  color: #5D4037;
  margin: 0 0 6px;
}
.type-card .short {
  font-size: 12px;
  color: rgba(93, 64, 55, 0.7);
  margin: 0;
}
.hover-info {
  position: absolute;
  inset: 0;
  background: rgba(255,255,255,0.96);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  font-size: 13px;
  color: #333;
  line-height: 1.5;
  opacity: 0;
  visibility: hidden;
  transition: 0.25s;
}
.hover-info.show {
  opacity: 1;
  visibility: visible;
}
/* =============== 2. 诗词 =============== */
.poem-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  height: 100%;
}
.poem-card {
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(8px);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  transition: all 0.3s;
}
.poem-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}
.poem-card h4 {
  font-size: 16px;
  color: #5D4037;
  margin: 0 0 10px;
}
.poem {
  font-size: 13px;
  color: #333;
  line-height: 1.6;
  font-style: italic;
  margin: 0 0 8px;
}
.author {
  font-size: 12px;
  color: #8B4513;
  text-align: right;
  margin: 0 0 6px;
}
.note {
  font-size: 11px;
  color: #999;
  margin: 0;
}
/* =============== 3. 文化寓意 =============== */
.culture-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  height: 100%;
}
.culture-card {
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(8px);
  border-radius: 12px;
  padding: 22px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  transition: all 0.3s;
}
.culture-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
}
.culture-card h3 {
  font-size: 16px;
  color: #5D4037;
  margin: 0 0 10px;
}
.culture-card p {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  margin: 0 0 12px;
}
.sub-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.sub-item {
  font-size: 12px;
  color: #333;
}
/* =============== 4. 重构后的地域特色样式 =============== */
.region-container {
  height: 100%;
  display: flex;
  gap: 20px;
}
.region-list {
  width: 300px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.region-item {
  flex:1;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(8px);
  border-radius:12px;
  padding:12px;
  display: flex;
  gap:12px;
  box-shadow:0 4px 16px rgba(0,0,0,0.1);
  transition: all 0.3s;
  cursor: pointer;
}
.region-item:hover {
  transform: translateX(4px);
  box-shadow:0 8px 24px rgba(0,0,0,0.15);
  background: rgba(255,255,255,0.95);
}
.region-item-img {
  width: 80px;
  height: 60px;
  border-radius:8px;
  overflow: hidden;
  flex-shrink: 0;
}
.region-item-img img {
  width:100%;
  height:100%;
  object-fit: cover;
}
.region-item-content {
  flex:1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.region-item-content h4 {
  font-size:15px;
  color:#5D4037;
  margin:0 0 4px;
}
.region-item-desc {
  font-size:12px;
  color:#666;
  margin:0 0 6px;
}
.region-item-features {
  display: flex;
  gap:6px;
  flex-wrap: wrap;
}
.region-item-features span {
  font-size:11px;
  background: rgba(139, 69, 19, 0.1);
  color:#8B4513;
  padding:2px 6px;
  border-radius:4px;
}
.region-chart-wrapper {
  flex:1;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(8px);
  border-radius:14px;
  padding:20px;
  box-shadow:0 4px 16px rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
}
.chart-title {
  font-size:16px; 
  font-weight:600; 
  color:#5D4037; 
  margin:0 0 12px;
  text-align: center;
}
.region-chart {
  flex:1;
  width:100%;
}
.chart-note {
  font-size:12px;
  color: #999;
  text-align: center;
  margin-top: 8px;
}
</style>