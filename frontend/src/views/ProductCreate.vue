<template>
  <div class="product-create-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>创建产品</span>
          <el-button @click="$router.back()">
            <el-icon><Back /></el-icon>
            返回
          </el-button>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="120px"
        style="max-width: 800px"
      >
        <el-form-item label="产品名称" prop="name">
          <el-input
            v-model="form.name"
            placeholder="例如: DJI Mini 3"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="产品描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="请详细描述您的产品特点、功能等"
          />
        </el-form-item>

        <el-form-item label="目标受众" prop="audience">
          <el-input
            v-model="form.audience"
            placeholder="例如: 摄影爱好者、旅行博主、航拍玩家"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="官网地址">
          <el-input
            v-model="form.website"
            placeholder="例如: https://www.dji.com"
            maxlength="500"
          />
        </el-form-item>

        <el-form-item label="竞争对手">
          <el-input
            v-model="form.competitors"
            type="textarea"
            :rows="3"
            placeholder="请列出主要竞争对手或竞品，用逗号或换行分隔"
          />
        </el-form-item>

        <el-alert
          title="提示"
          type="info"
          :closable="false"
          style="margin-bottom: 20px"
        >
          <p>创建产品后，系统将使用 AI 自动分析并生成相关关键词，用于后续的 Reddit 频道搜索。</p>
          <p>关键词分为三类：产品关键词、竞品关键词、行业关键词。</p>
        </el-alert>

        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="handleSubmit">
            <el-icon><Check /></el-icon>
            创建并生成关键词
          </el-button>
          <el-button @click="$router.back()">
            取消
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { createProduct } from '@/api/reddit'
import { ElMessage } from 'element-plus'

const router = useRouter()
const formRef = ref(null)
const submitting = ref(false)

const form = reactive({
  name: '',
  description: '',
  audience: '',
  website: '',
  competitors: ''
})

const rules = {
  name: [
    { required: true, message: '请输入产品名称', trigger: 'blur' },
    { max: 200, message: '产品名称不能超过200个字符', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入产品描述', trigger: 'blur' }
  ],
  audience: [
    { required: true, message: '请输入目标受众', trigger: 'blur' },
    { max: 500, message: '目标受众不能超过500个字符', trigger: 'blur' }
  ]
}

const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitting.value = true

    const data = {
      name: form.name,
      description: form.description,
      audience: form.audience,
      website: form.website || null,
      competitors: form.competitors || null
    }

    const res = await createProduct(data)
    ElMessage.success('产品创建成功！AI 已生成关键词')
    router.push(`/products/${res.id}`)
  } catch (error) {
    console.error('创建产品失败:', error)
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.product-create-container {
  max-width: 1000px;
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
</style>
