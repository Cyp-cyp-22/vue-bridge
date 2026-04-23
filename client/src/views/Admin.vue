<template>
  <div class="admin-container">
    <div class="admin-header">
      <h1>古桥古道数据后台管理</h1>
      <div class="header-tip">管理后台数据，修改后大屏会自动同步最新数据</div>
    </div>

    <el-tabs v-model="activeTab" type="border-card" class="admin-tabs">
      <!-- 桥梁管理 -->
      <el-tab-pane label="桥梁管理" name="bridges">
        <div class="table-header">
          <el-button type="primary" @click="addBridge">新增桥梁</el-button>
        </div>
        <el-table :data="bridgeList" border stripe style="width: 100%">
          <el-table-column label="ID" width="60">
            <template #default="scope">
              {{ scope.$index + 1 }}
            </template>
          </el-table-column>
          <el-table-column prop="name" label="桥梁名称" width="150" />
          <el-table-column prop="dynasty" label="朝代" width="100" />
          <el-table-column prop="type" label="桥型" width="100" />
          <el-table-column prop="address" label="地址" min-width="200" />
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="scope">
              <el-button size="small" @click="editBridge(scope.row)">编辑</el-button>
              <el-button size="small" type="danger" @click="deleteBridge(scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 古道管理 -->
      <el-tab-pane label="古道管理" name="roads">
        <div class="table-header">
          <el-button type="primary" @click="addRoad">新增古道</el-button>
        </div>
        <el-table :data="roadList" border stripe style="width: 100%">
          <el-table-column label="ID" width="60">
            <template #default="scope">
              {{ scope.$index + 1 }}
            </template>
          </el-table-column>
          <el-table-column prop="name" label="古道名称" width="150" />
          <el-table-column prop="period" label="时期" width="100" />
          <el-table-column prop="start_point" label="起点" width="200" />
          <el-table-column prop="end_point" label="终点" width="200" />
          <el-table-column prop="length" label="长度(km)" width="160" />
          <el-table-column label="关联桥梁数" width="600">
            <template #default="scope">
              {{ scope.row.bridgeIds?.length || 0 }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="scope">
              <el-button size="small" @click="editRoad(scope.row)">编辑</el-button>
              <el-button size="small" type="danger" @click="deleteRoad(scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- 桥梁表单弹窗 -->
    <el-dialog v-model="bridgeDialogVisible" :title="isEdit ? '编辑桥梁' : '新增桥梁'" width="500px">
      <el-form :model="bridgeForm" label-width="80px">
        <el-form-item label="桥梁名称" required>
          <el-input v-model="bridgeForm.name" placeholder="请输入桥梁名称" />
        </el-form-item>
        <el-form-item label="朝代">
          <el-input v-model="bridgeForm.dynasty" placeholder="如：唐、宋、明" />
        </el-form-item>
        <el-form-item label="桥型">
          <el-input v-model="bridgeForm.type" placeholder="如：石拱桥、梁桥" />
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="bridgeForm.address" placeholder="请输入详细地址" />
        </el-form-item>
        <el-form-item label="纬度">
          <el-input v-model.number="bridgeForm.lat" placeholder="如：30.1234" />
        </el-form-item>
        <el-form-item label="经度">
          <el-input v-model.number="bridgeForm.lng" placeholder="如：120.1234" />
        </el-form-item>
        <el-form-item label="介绍">
          <el-input v-model="bridgeForm.intro" type="textarea" rows="3" placeholder="请输入桥梁介绍" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="bridgeDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitBridgeForm">提交</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 古道表单弹窗 -->
    <el-dialog v-model="roadDialogVisible" :title="isEdit ? '编辑古道' : '新增古道'" width="600px">
      <el-form :model="roadForm" label-width="80px">
        <el-form-item label="古道名称" required>
          <el-input v-model="roadForm.name" placeholder="请输入古道名称" />
        </el-form-item>
        <el-form-item label="时期">
          <el-input v-model="roadForm.period" placeholder="如：隋唐、明清" />
        </el-form-item>
        <el-form-item label="起点">
          <el-input v-model="roadForm.start_point" placeholder="请输入起点" />
        </el-form-item>
        <el-form-item label="终点">
          <el-input v-model="roadForm.end_point" placeholder="请输入终点" />
        </el-form-item>
        <el-form-item label="长度(km)">
          <el-input v-model.number="roadForm.length" placeholder="请输入古道长度" />
        </el-form-item>
        <el-form-item label="介绍">
          <el-input v-model="roadForm.description" type="textarea" rows="2" placeholder="请输入古道介绍" />
        </el-form-item>
        <el-form-item label="关联桥梁">
          <el-checkbox-group v-model="roadForm.bridgeIds">
            <el-checkbox v-for="bridge in allBridges" :key="bridge.id" :label="bridge.id">
              {{ bridge.name }}
            </el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="roadDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitRoadForm">提交</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const activeTab = ref('bridges')
const bridgeList = ref([])
const roadList = ref([])
const allBridges = ref([])
const bridgeDialogVisible = ref(false)
const roadDialogVisible = ref(false)
const isEdit = ref(false)

// 桥梁表单
const bridgeForm = ref({
  id: null, name: '', dynasty: '', type: '', address: '', intro: '', lat: '', lng: ''
})

// 古道表单
const roadForm = ref({
  id: null, name: '', period: '', description: '', start_point: '', end_point: '', length: '', bridgeIds: []
})

// 加载数据 —— 仅修复这里，其他完全不动
async function fetchBridges() {
  try {
    const res = await fetch('http://localhost:3001/api/admin/bridges')
    const data = await res.json()
    bridgeList.value = Array.isArray(data) ? data : []
  } catch (err) {
    ElMessage.error('加载桥梁数据失败')
  }
}

async function fetchRoads() {
  try {
    const res = await fetch('http://localhost:3001/api/admin/roads')
    const data = await res.json()
    roadList.value = Array.isArray(data) ? data : []
  } catch (err) {
    ElMessage.error('加载古道数据失败')
  }
}

async function fetchAllBridges() {
  try {
    const res = await fetch('http://localhost:3001/api/admin/bridges')
    const data = await res.json()
    allBridges.value = Array.isArray(data) ? data : []
  } catch (err) {
    ElMessage.error('加载桥梁选项失败')
  }
}

// 桥梁操作
function addBridge() {
  isEdit.value = false
  bridgeForm.value = { id: null, name: '', dynasty: '', type: '', address: '', intro: '', lat: '', lng: '' }
  bridgeDialogVisible.value = true
}

function editBridge(row) {
  isEdit.value = true
  bridgeForm.value = { ...row }
  bridgeDialogVisible.value = true
}

async function submitBridgeForm() {
  if (!bridgeForm.value.name) {
    ElMessage.warning('请输入桥梁名称')
    return
  }
  try {
    let res
    if (isEdit.value) {
      res = await fetch(`http://localhost:3001/api/admin/bridges/${bridgeForm.value.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bridgeForm.value)
      })
    } else {
      res = await fetch('http://localhost:3001/api/admin/bridges', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bridgeForm.value)
      })
    }
    const data = await res.json()
    ElMessage.success(data.message || '操作成功')
    bridgeDialogVisible.value = false
    await fetchBridges()
    await fetchAllBridges()
  } catch (err) {
    ElMessage.error('提交失败')
  }
}

async function deleteBridge(row) {
  try {
    await ElMessageBox.confirm(`确定要删除桥梁「${row.name}」吗？删除后无法恢复！`, '删除确认', { type: 'warning' })
    const res = await fetch(`http://localhost:3001/api/admin/bridges/${row.id}`, { method: 'DELETE' })
    const data = await res.json()
    ElMessage.success(data.message || '删除成功')
    await fetchBridges()
    await fetchAllBridges()
  } catch (err) {
    if (err !== 'cancel') ElMessage.error('删除失败')
  }
}

// 古道操作
function addRoad() {
  isEdit.value = false
  roadForm.value = { id: null, name: '', period: '', description: '', start_point: '', end_point: '', length: '', bridgeIds: [] }
  roadDialogVisible.value = true
}

function editRoad(row) {
  isEdit.value = true
  roadForm.value = { ...row }
  roadDialogVisible.value = true
}

async function submitRoadForm() {
  if (!roadForm.value.name) {
    ElMessage.warning('请输入古道名称')
    return
  }
  try {
    let res
    if (isEdit.value) {
      res = await fetch(`http://localhost:3001/api/admin/roads/${roadForm.value.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roadForm.value)
      })
    } else {
      res = await fetch('http://localhost:3001/api/admin/roads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roadForm.value)
      })
    }
    const data = await res.json()
    ElMessage.success(data.message || '操作成功')
    roadDialogVisible.value = false
    await fetchRoads()
  } catch (err) {
    ElMessage.error('提交失败')
  }
}

async function deleteRoad(row) {
  try {
    await ElMessageBox.confirm(`确定要删除古道「${row.name}」吗？删除后无法恢复！`, '删除确认', { type: 'warning' })
    const res = await fetch(`http://localhost:3001/api/admin/roads/${row.id}`, { method: 'DELETE' })
    const data = await res.json()
    ElMessage.success(data.message || '删除成功')
    await fetchRoads()
  } catch (err) {
    if (err !== 'cancel') ElMessage.error('删除失败')
  }
}

onMounted(async () => {
  await fetchBridges()
  await fetchRoads()
  await fetchAllBridges()
})
</script>

<style scoped>
.admin-container {
  min-height: 100vh;
  background-color: #0f0f23;
  padding: 20px;
  color: #fff;
}

.admin-header {
  text-align: center;
  margin-bottom: 20px;
}

.admin-header h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #fff;
}

.header-tip {
  color: #999;
  font-size: 14px;
}

.table-header {
  margin-bottom: 15px;
}

:deep(.el-tabs__item) {
  color: #ccc;
}

:deep(.el-tabs__item.is-active) {
  color: #409eff;
}

:deep(.el-table) {
  background-color: #1a1a2e;
  color: #fff;
  --el-table-border-color: #2d2d44;
  --el-table-bg-color: #1a1a2e;
  --el-table-striped-bg-color: #252541;
  --el-table-row-hover-bg-color: #2d2d44;
  --el-text-color-primary: #fff;
  --el-text-color-regular: #eee;
  --el-text-color-secondary: #ccc;
  /* 修复深色主题下表格文字不可见的问题：覆盖Element Plus默认浅色主题变量 */
}

:deep(.el-table th.el-table__cell) {
  background-color: #16162a;
}

:deep(.el-dialog) {
  background-color: #1a1a2e;
  color: #fff;
}

:deep(.el-form-item__label) {
  color: #ccc;
}
:deep(.el-tabs--border-card) {
  background-color: #1a1a2e;
  border-color: #2d2d44;
}
/* 统一所有表头背景（包括固定列操作） */
:deep(.el-table th.el-table__cell),
:deep(.el-table th.el-table__cell.is-fixed-right) {
  background-color: #16162a !important;
  color: #fff !important;
}

/* 表格内容文字统一白色 */
:deep(.el-table td.el-table__cell) {
  color: #fff !important;
  background-color: #1a1a2e !important;
}

/* 悬浮行样式 */
:deep(.el-table__row:hover td.el-table__cell) {
  background-color: #2d2d44 !important;
  color: #fff !important;
}

/* 按钮文字颜色正常 */
:deep(.el-table .el-button:not([type="danger"])) {
  color: #2d2d44 !important;
}

</style>