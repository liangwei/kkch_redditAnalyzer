<template>
  <div class="credentials-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>Reddit API 凭证管理</span>
          <el-button type="primary" @click="showAddDialog">
            <el-icon><Plus /></el-icon>
            添加凭证
          </el-button>
        </div>
      </template>

      <el-alert
        v-if="credentials.length === 0"
        title="提示"
        type="info"
        description="您还没有添加Reddit凭证。请先添加凭证才能使用Reddit分析功能。"
        :closable="false"
        style="margin-bottom: 20px"
      />

      <el-table v-loading="loading" :data="credentials" stripe>
        <el-table-column prop="credential_name" label="凭证名称" min-width="150" />
        <el-table-column prop="client_id" label="Client ID" min-width="200" />
        <el-table-column prop="user_agent" label="User Agent" min-width="200" />
        <el-table-column prop="username" label="Reddit用户名" min-width="150">
          <template #default="{ row }">
            {{ row.username || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="默认凭证" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.is_default === 1" type="success">是</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.status === 1" type="success">正常</el-tag>
            <el-tag v-else type="danger">禁用</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="handleTest(row)">
              测试
            </el-button>
            <el-button
              v-if="row.is_default !== 1"
              size="small"
              type="primary"
              @click="handleSetDefault(row)"
            >
              设为默认
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加凭证对话框 -->
    <el-dialog
      v-model="addDialogVisible"
      title="添加 Reddit 凭证"
      width="600px"
      @close="resetForm"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
      >
        <el-form-item label="凭证名称" prop="credential_name">
          <el-input v-model="form.credential_name" placeholder="为凭证命名" />
        </el-form-item>

        <el-form-item label="Client ID" prop="client_id">
          <el-input v-model="form.client_id" placeholder="Reddit Client ID" />
        </el-form-item>

        <el-form-item label="Client Secret" prop="client_secret">
          <el-input
            v-model="form.client_secret"
            type="password"
            placeholder="Reddit Client Secret"
            show-password
          />
        </el-form-item>

        <el-form-item label="User Agent" prop="user_agent">
          <el-input
            v-model="form.user_agent"
            placeholder="例如: MyApp/1.0"
          />
        </el-form-item>

        <el-form-item label="Reddit用户名">
          <el-input v-model="form.username" placeholder="可选" />
        </el-form-item>

        <el-form-item label="Reddit密码">
          <el-input
            v-model="form.password"
            type="password"
            placeholder="可选"
            show-password
          />
        </el-form-item>

        <el-alert
          title="如何获取 Reddit API 凭证？"
          type="info"
          :closable="false"
        >
          <p>1. 访问 <a href="https://www.reddit.com/prefs/apps" target="_blank">Reddit Apps</a></p>
          <p>2. 点击 "create app" 或 "create another app"</p>
          <p>3. 选择类型为 "script"</p>
          <p>4. 创建后即可获得 Client ID 和 Client Secret</p>
        </el-alert>
      </el-form>

      <template #footer>
        <el-button @click="addDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleAdd">
          确定
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import {
  getCredentials,
  createCredential,
  testCredential,
  setDefaultCredential
} from '@/api/reddit'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const credentials = ref([])
const addDialogVisible = ref(false)
const submitting = ref(false)
const formRef = ref(null)

const form = reactive({
  credential_name: '',
  client_id: '',
  client_secret: '',
  user_agent: '',
  username: '',
  password: ''
})

const rules = {
  credential_name: [
    { required: true, message: '请输入凭证名称', trigger: 'blur' }
  ],
  client_id: [
    { required: true, message: '请输入 Client ID', trigger: 'blur' }
  ],
  client_secret: [
    { required: true, message: '请输入 Client Secret', trigger: 'blur' }
  ],
  user_agent: [
    { required: true, message: '请输入 User Agent', trigger: 'blur' }
  ]
}

const fetchCredentials = async () => {
  loading.value = true
  try {
    const res = await getCredentials()
    credentials.value = res
  } catch (error) {
    console.error('获取凭证列表失败:', error)
  } finally {
    loading.value = false
  }
}

const showAddDialog = () => {
  addDialogVisible.value = true
}

const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  Object.assign(form, {
    credential_name: '',
    client_id: '',
    client_secret: '',
    user_agent: '',
    username: '',
    password: ''
  })
}

const handleAdd = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitting.value = true

    await createCredential({
      ...form,
      username: form.username || null,
      password: form.password || null
    })

    ElMessage.success('凭证添加成功')
    addDialogVisible.value = false
    fetchCredentials()
  } catch (error) {
    console.error('添加凭证失败:', error)
  } finally {
    submitting.value = false
  }
}

const handleTest = async (row) => {
  try {
    const res = await testCredential(row.id)
    if (res.valid) {
      ElMessage.success(res.message || '凭证有效')
    } else {
      ElMessage.error(res.message || '凭证无效')
    }
  } catch (error) {
    console.error('测试凭证失败:', error)
  }
}

const handleSetDefault = async (row) => {
  try {
    await setDefaultCredential(row.id)
    ElMessage.success('已设为默认凭证')
    fetchCredentials()
  } catch (error) {
    console.error('设置默认凭证失败:', error)
  }
}

onMounted(() => {
  fetchCredentials()
})
</script>

<style scoped>
.credentials-container {
  max-width: 1400px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.el-alert p {
  margin: 5px 0;
  font-size: 13px;
}

.el-alert a {
  color: #409eff;
  text-decoration: none;
}

.el-alert a:hover {
  text-decoration: underline;
}
</style>
