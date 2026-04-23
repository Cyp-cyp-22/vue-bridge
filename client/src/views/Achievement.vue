<template>
  <div class="achievement-page">
    <div class="top-header">
      <h2>🏛️ 中国古桥建筑成就</h2>
      <p>千年工程智慧 · 世界桥梁奇迹</p>
    </div>
    <div class="main-tabs">
      <button 
        v-for="tab in tabs" 
        :key="tab.key"
        class="tab-btn"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key">
        {{ tab.label }}
      </button>
    </div>
    <div class="main-panel">
      <!-- 1. 技术突破 -->
      <div v-show="activeTab === 'tech'" class="panel">
        <div class="tech-grid">
          <div v-for="(item, idx) in techList" :key="idx" class="tech-card">
            <div class="tech-label" :style="{ background: item.color }">{{ item.category }}</div>
            <h3>{{ item.title }}</h3>
            <p>{{ item.desc }}</p>
            <div class="tech-info">
              <span>领先世界：{{ item.lead }}年</span>
            </div>
            <div class="tech-bridge">代表：{{ item.bridge }}</div>
          </div>
        </div>
      </div>
      <!-- 2. 古桥详情 -->
      <div v-show="activeTab === 'bridge'" class="panel">
        <div class="bridge-page">
          <div class="bridge-nav">
            <div 
              v-for="(b, idx) in bridgeList" 
              :key="idx"
              class="nav-item"
              :class="{ active: selectedBridgeIdx === idx }"
              @click="selectedBridgeIdx = idx">
              {{ b.name }}
            </div>
          </div>
          <div class="bridge-detail">
            <h3>{{ currentBridge.name }}</h3>
            <div class="meta">
              <span>{{ currentBridge.dynasty }}</span>
              <span>{{ currentBridge.type }}</span>
              <span>{{ currentBridge.location }}</span>
            </div>
            <p class="bd-desc">{{ currentBridge.desc }}</p>
            <div class="bd-data">
              <div class="data-title">📊 核心数据</div>
              <div class="data-grid">
                <div><label>全长</label><span>{{ currentBridge.length }}</span></div>
                <div><label>宽度</label><span>{{ currentBridge.width }}</span></div>
                <div><label>跨度</label><span>{{ currentBridge.span }}</span></div>
                <div><label>建造时间</label><span>{{ currentBridge.year }}</span></div>
              </div>
            </div>
            <div class="bd-feat">
              <div class="feat-title">✨ 技术亮点</div>
              <div v-for="f in currentBridge.features" class="feat">
                {{ f }}
              </div>
            </div>
          </div>
        </div>
      </div>
      <!-- 3. 历史时间线（已重构） -->
      <div v-show="activeTab === 'history'" class="panel">
        <div class="history-container">
          <!-- 时间线部分 -->
          <div class="timeline-wrapper">
            <div class="timeline-line"></div>
            <div class="timeline-h">
              <div 
                v-for="(item, idx) in historyList" 
                :key="idx"
                class="h-item"
                @mouseenter="handleHover(idx)"
                @mouseleave="handleLeave()">
                <div class="h-dot" :class="{ active: hIdx === idx }"></div>
                <div class="h-year">{{ item.year }}</div>
                <div class="h-content" :class="{ show: hIdx === idx }">
                  <h4>{{ item.name }}</h4>
                  <p>{{ item.desc }}</p>
                  <div class="h-achv">{{ item.achv }}</div>
                </div>
              </div>
            </div>
          </div>
          <!-- 数据可视化图表 -->
          <div class="chart-wrapper">
            <h4 class="chart-title">📊 各时期全国重点文保古桥数量分布</h4>
            <div ref="chartRef" class="bridge-chart"></div>
            <p class="chart-note">数据来源：全国重点文物保护单位桥梁遗存统计（共111座）</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
const activeTab = ref('tech')
const tabs = [
  { key: 'tech', label: '⚡ 技术突破' },
  { key: 'bridge', label: '🌉 名桥详情' },
  { key: 'history', label: '📅 历史时间线' },
]
const hIdx = ref(null)
const selectedBridgeIdx = ref(0)
const chartRef = ref(null)
let chart = null

// 图表数据：各时期文保古桥数量
const chartData = {
  categories: ['先秦', '秦汉', '隋唐', '两宋', '元代', '明代', '清代'],
  values: [3, 7, 12, 35, 8, 22, 24]
}

// 技术突破
const techList = [
  {
    category: '基础工程',
    title: '筏型基础',
    desc: '世界最早的桥梁基础技术，在江海淤泥中铺设巨型石筏，解决软土地基问题。',
    lead: 1000,
    bridge: '洛阳桥',
    color: '#4a90e2'
  },
  {
    category: '生物工程',
    title: '牡蛎固基',
    desc: '利用牡蛎的自然生长将桥墩与礁石胶结在一起，世界最早的生物建筑技术。',
    lead: 900,
    bridge: '洛阳桥',
    color: '#50c878'
  },
  {
    category: '结构力学',
    title: '空腹拱技术',
    desc: '在拱肩上开孔，减轻桥身重量，同时增加泄洪能力，比欧洲早700年。',
    lead: 700,
    bridge: '赵州桥',
    color: '#f5a623'
  },
  {
    category: '材料科学',
    title: '巨型石梁',
    desc: '开采、运输、架设上百吨的巨型石梁，古代起重技术的巅峰。',
    lead: 800,
    bridge: '安平桥',
    color: '#d0021b'
  },
  {
    category: '潮汐工程',
    title: '潮汐建桥',
    desc: '利用潮汐涨落来运输和架设巨型石梁，精准利用自然力量。',
    lead: 600,
    bridge: '万安桥',
    color: '#9b59b6'
  },
  {
    category: '抗震技术',
    title: '柔性结构',
    desc: '采用榫卯、柔性连接，能够抵御地震和洪水，千年不倒。',
    lead: 500,
    bridge: '都江堰安澜桥',
    color: '#1abc9c'
  }
]

// 名桥详情
const bridgeList = [
  {
    name: '赵州桥',
    dynasty: '隋',
    type: '石拱桥',
    location: '河北赵县',
    desc: '赵州桥是世界上现存最古老的石拱桥，由李春设计建造，开创了中国桥梁建造的崭新局面。它采用空腹拱技术，比欧洲同类技术早了700年。',
    length: '64.4米',
    width: '9.6米',
    span: '37.02米',
    year: '公元595-605年',
    features: [
      '世界最早的空腹拱桥',
      '跨度37米，千年无大修',
      '4个小拱，减轻自重20%',
      '泄洪能力提升，保护桥身'
    ]
  },
  {
    name: '卢沟桥',
    dynasty: '金',
    type: '联拱石桥',
    location: '北京丰台',
    desc: '卢沟桥是北京现存最古老的石造联拱桥，以其精美的石狮雕刻闻名于世，也是七七事变的发生地，见证了中国的历史变迁。',
    length: '266.5米',
    width: '9.3米',
    span: '11孔联拱',
    year: '公元1189-1192年',
    features: [
      '501只石狮，形态各异',
      '11孔联拱，整体受力',
      '马可波罗曾记载此桥',
      '抗日战争爆发地'
    ]
  },
  {
    name: '洛阳桥',
    dynasty: '北宋',
    type: '梁式石桥',
    location: '福建泉州',
    desc: '洛阳桥是中国第一座跨海大桥，首创了筏型基础和牡蛎固基技术，开创了跨海桥梁建造的先河，是中国古代桥梁工程的里程碑。',
    length: '731.29米',
    width: '4.5米',
    span: '46孔',
    year: '公元1053-1059年',
    features: [
      '世界最早的筏型基础',
      '牡蛎固基，生物胶结',
      '跨海大桥，江海造桥',
      '比西方同类技术早千年'
    ]
  },
  {
    name: '安平桥',
    dynasty: '南宋',
    type: '梁式石桥',
    location: '福建晋江',
    desc: '安平桥是中国现存最长的古代石桥，有“天下无桥长此桥”的美誉，全长超过2公里，是古代泉州海上丝绸之路的重要见证。',
    length: '2255米',
    width: '3-3.8米',
    span: '361孔',
    year: '公元1138-1152年',
    features: [
      '古代最长石桥，2.25公里',
      '巨型石梁，每根上百吨',
      '利用潮汐运输石材',
      '海上丝绸之路的见证'
    ]
  },
  {
    name: '泸定桥',
    dynasty: '清',
    type: '铁索桥',
    location: '四川泸定',
    desc: '泸定桥是大渡河上的铁索桥，由13根铁索组成，是川藏交通的咽喉要道，飞夺泸定桥的战役使其闻名中外。',
    length: '103.67米',
    width: '3米',
    span: '100米',
    year: '公元1705年',
    features: [
      '13根铁索，重21吨',
      '横跨大渡河，天险变通途',
      '红军飞夺泸定桥',
      '长征的重要节点'
    ]
  }
]
const currentBridge = computed(() => bridgeList[selectedBridgeIdx.value])

// 重构后的历史时间线数据
const historyList = [
  { 
    year: '先秦', 
    name: '桥梁起源', 
    desc: '最早的浮桥出现，周文王娶亲时在渭水造浮桥，开启了中国桥梁建造的历史。', 
    achv: '开启桥梁史' 
  },
  { 
    year: '秦汉', 
    name: '体系初成', 
    desc: '秦驰道配套标准化木梁桥，建成完整的军用栈道网络；东汉建成长江上第一座浮桥，李冰修建都江堰同时建造索桥。', 
    achv: '水利+桥梁' 
  },
  { 
    year: '隋唐', 
    name: '技术突破', 
    desc: '李春建造赵州桥，空腹拱技术诞生；潮州建成广济桥，世界最早的启闭式桥梁；长安出现大型联拱石桥。', 
    achv: '世界第一拱' 
  },
  { 
    year: '两宋', 
    name: '技术巅峰', 
    desc: '蔡襄建造洛阳桥，首创筏型基础与牡蛎固基；建成安平桥，天下第一长桥；《清明上河图》中的虹桥代表木拱技术巅峰，《营造法式》规范石桥工艺。', 
    achv: '跨海工程' 
  },
  { 
    year: '元代', 
    name: '工艺成熟', 
    desc: '闽浙地区木拱廊桥技术日趋成熟，榫卯结构广泛应用，石桥建造开始走向标准化，为明清官式桥梁奠定基础。', 
    achv: '标准化起步' 
  },
  { 
    year: '明代', 
    name: '广泛普及', 
    desc: '全国大规模修建桥梁，四川泸县形成庞大的龙桥群，仅明清两代就新建近300座龙桥，桥梁维护制度逐步完善。', 
    achv: '龙桥群兴起' 
  },
  { 
    year: '清代', 
    name: '集大成者', 
    desc: '建成泸定铁索桥，跨越天险；《清官式石桥做法》颁布，形成标准化施工规范，古桥营造技艺达到历史巅峰。', 
    achv: '官式标准' 
  }
]

// 初始化图表
const initChart = () => {
  if (!chartRef.value) return
  chart = echarts.init(chartRef.value)
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
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: chartData.categories,
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
        data: chartData.values,
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
  chart.setOption(option)
  // 响应式适配
  window.addEventListener('resize', () => {
    chart?.resize()
  })
}

// 时间线hover交互：联动图表高亮
const handleHover = (idx) => {
  hIdx.value = idx
  if (chart) {
    chart.dispatchAction({
      type: 'highlight',
      seriesIndex: 0,
      dataIndex: idx
    })
  }
}

// 鼠标离开：取消高亮
const handleLeave = () => {
  hIdx.value = null
  if (chart) {
    chart.dispatchAction({
      type: 'downplay',
      seriesIndex: 0
    })
  }
}

// 生命周期：初始化图表
onMounted(() => {
  if (activeTab.value === 'history') {
    nextTick(() => initChart())
  }
})

// 监听标签切换，确保切换到历史页时初始化图表
watch(activeTab, (val) => {
  if (val === 'history' && !chart) {
    nextTick(() => initChart())
  }
})
</script>

<style scoped>
.achievement-page {
  width: 100%;
  min-height: 100vh;
  margin-top: 60px;

  background-attachment: fixed;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.top-header {
  padding: 18px 20px;
  text-align: center;
  background: rgba(255,255,255,0.7);
  backdrop-filter: blur(10px);
}
.top-header h2 {
  margin: 0;
  font-size: 24px;
  color: #5D4037;
}
.top-header p {
  margin: 4px 0 0;
  font-size: 13px;
  color: rgba(93, 64, 55, 0.7);
}
.main-tabs {
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
.main-panel {
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

.tech-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  height: 100%;
}
.tech-card {
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(8px);
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  position: relative;
  transition: all 0.3s;
}
.tech-card:hover { transform: translateY(-4px); box-shadow:0 8px 24px rgba(0,0,0,0.15); }
.tech-label {
  position: absolute;
  top: 0;
  left: 0;
  padding: 4px 10px;
  font-size: 12px;
  border-radius: 0 0 8px 0;
  color: #fff;
}
.tech-card h3 {
  margin: 8px 0 10px;
  font-size: 17px;
  color: #5D4037;
}
.tech-card p {
  font-size: 13px;
  color: #666;
  line-height: 1.5;
  margin: 0 0 12px;
}
.tech-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #777;
  margin-bottom: 6px;
}
.tech-bridge {
  font-size: 12px;
  color: #8B4513;
}

.bridge-page { display:flex; gap:22px; height:100%; }
.bridge-nav { 
  width:230px; 
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(8px);
  border-radius:14px; padding:20px; display:flex; flex-direction:column; gap:10px; 
  box-shadow:0 4px 16px rgba(0,0,0,0.1);
}
.nav-item {
  padding:12px 14px; background:rgba(247, 249, 250, 0.6); border-radius:8px; font-size:14px; cursor:pointer;
  transition: all 0.26s;
  color: #5D4037;
}
.nav-item:hover { transform: translateX(4px); background:rgba(230, 235, 240, 0.8); }
.nav-item.active { background: #8B4513; color:#fff; }
.bridge-detail { 
  flex:1; 
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(8px);
  border-radius:14px; padding:28px; 
  box-shadow:0 4px 16px rgba(0,0,0,0.1);
  overflow-y:auto;
}
.bridge-detail h3 { font-size:22px; margin:0 0 12px; color:#5D4037; }
.meta { display:flex; gap:16px; font-size:13px; color:#8B4513; margin-bottom:18px; flex-wrap:wrap; }
.bd-desc { font-size:15px; color:#444; line-height:1.7; margin-bottom:24px; }
.bd-data { margin-bottom:24px; }
.data-title { font-size:16px; font-weight:600; color:#5D4037; margin-bottom:12px; }
.data-grid { display:grid; grid-template-columns: repeat(2,1fr); gap:10px 16px; }
.data-grid div { display:flex; justify-content:space-between; padding:6px 0; border-bottom:1px dashed rgba(0,0,0,0.1); }
.data-grid label { font-size:13px; color:#666; }
.data-grid span { font-size:13px; color:#8B4513; }
.feat-title { font-size:16px; font-weight:600; color:#5D4037; margin-bottom:12px; }
.bd-feat { display:flex; flex-direction:column; gap:10px; }
.feat { font-size:14px; color:#333; line-height:1.6; }

/* 重构后的历史时间线样式 */
.history-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: rgba(255,255,255,0.85);
  backdrop-filter: blur(8px);
  border-radius:14px; 
  padding:30px; 
  box-shadow:0 4px 16px rgba(0,0,0,0.1);
}
.timeline-wrapper {
  position: relative;
  padding: 20px 0 30px;
}
.timeline-line {
  position: absolute;
  top: 50px;
  left: 30px;
  right: 30px;
  height: 3px;
  background: #e1e8f0;
  border-radius: 2px;
}
.timeline-h { 
  display:flex; 
  justify-content: space-between;
  position: relative;
  z-index: 1;
}
.h-item { 
  position:relative; 
  text-align:center; 
  flex:1;
}
.h-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #e1e8f0;
  margin: 0 auto 8px;
  transition: all 0.3s;
}
.h-dot.active {
  background: #8B4513;
  transform: scale(1.3);
  box-shadow: 0 0 0 4px rgba(139, 69, 19, 0.2);
}
.h-year { 
  font-size:16px; 
  font-weight:bold; 
  color:#5D4037; 
  margin-bottom:12px;
  transition: all 0.3s;
}
.h-item:hover .h-year {
  color: #8B4513;
}
.h-content {
  position:absolute; 
  top: 100%; 
  left:50%; 
  transform:translateX(-50%);
  background:#fff; 
  border-radius:10px; 
  padding:15px; 
  width:240px;
  box-shadow:0 5px 15px rgba(0,0,0,0.12);
  opacity:0; 
  visibility:hidden; 
  transition: all 0.35s;
  z-index: 2;
}
.h-content.show { 
  opacity:1; 
  visibility:visible; 
  transform: translateX(-50%) translateY(8px);
}
.h-content h4 { 
  font-size:15px; 
  margin:0 0 8px; 
  color:#5D4037; 
}
.h-content p { 
  font-size:13px; 
  color:#666; 
  line-height:1.45; 
}
.h-achv { 
  font-size:12px; 
  color:#8B4513; 
  margin-top: 6px;
}
.chart-wrapper {
  flex:1;
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
.bridge-chart {
  flex:1;
  width: 100%;
}
.chart-note {
  font-size:12px;
  color: #999;
  text-align: center;
  margin-top: 8px;
}
</style>