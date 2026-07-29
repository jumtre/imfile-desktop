<template>
  <el-dialog
    class="update-task-link-dialog"
    width="600px"
    :title="$t('task.update-link-title')"
    :model-value="visible"
    :close-on-click-modal="false"
    @close="handleClose"
    @closed="handleClosed"
  >
    <p class="update-task-link-hint">{{ $t('task.update-link-hint') }}</p>
    <el-form ref="form" :model="form" :rules="rules" @submit.prevent>
      <el-form-item prop="uri">
        <el-input
          v-model="form.uri"
          type="textarea"
          :autosize="{ minRows: 3, maxRows: 6 }"
          :placeholder="$t('task.update-link-placeholder')"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">{{ $t('app.cancel') }}</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          {{ $t('app.submit') }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script>
import { useI18n } from 'vue-i18n'
import { commands } from '@/components/CommandManager/instance'
import { canUpdateTaskUri, getTaskName, getTaskUri, splitTaskLinks } from '@shared/utils'

export default {
  name: 'mo-update-task-link',
  setup () {
    const { t } = useI18n()
    return { t }
  },
  data () {
    return {
      visible: false,
      submitting: false,
      task: null,
      form: {
        uri: ''
      }
    }
  },
  computed: {
    rules () {
      return {
        uri: [
          {
            validator: (_rule, value, callback) => {
              const links = splitTaskLinks(value)
              if (!links.length) {
                callback(new Error(this.t('task.update-link-required')))
                return
              }
              if (links.length > 1) {
                callback(new Error(this.t('task.update-link-single-only')))
                return
              }
              callback()
            },
            trigger: 'blur'
          }
        ]
      }
    }
  },
  methods: {
    open (task) {
      if (!canUpdateTaskUri(task)) {
        this.$msg.warning(this.t('task.update-link-not-supported'))
        return
      }
      this.task = task
      this.form.uri = getTaskUri(task)
      this.visible = true
    },
    handleClose () {
      this.visible = false
    },
    handleClosed () {
      this.task = null
      this.form.uri = ''
      this.submitting = false
      this.$refs.form?.resetFields?.()
    },
    handleOpenDialog (payload) {
      const { task } = payload || {}
      if (!task) {
        return
      }
      this.open(task)
    },
    handleSubmit () {
      this.$refs.form.validate((valid) => {
        if (!valid || !this.task) {
          return
        }

        const [newUri] = splitTaskLinks(this.form.uri)
        const taskName = getTaskName(this.task, {
          defaultName: this.t('task.get-task-name')
        })

        this.submitting = true
        this.$store.dispatch('task/changeTaskUri', {
          task: this.task,
          newUri
        })
          .then(() => {
            this.$msg.success(this.t('task.update-link-success', { taskName }))
            this.handleClose()
          })
          .catch((err) => {
            const code = err && err.code
            if (code === 'CHANGE_URI_NOT_SUPPORTED') {
              this.$msg.error(this.t('task.update-link-not-supported'))
              return
            }
            this.$msg.error(this.t('task.update-link-fail', { taskName }))
          })
          .finally(() => {
            this.submitting = false
          })
      })
    }
  },
  mounted () {
    commands.on('update-task-link', this.handleOpenDialog)
  },
  unmounted () {
    commands.off('update-task-link', this.handleOpenDialog)
  }
}
</script>

<style lang="scss">
.update-task-link-dialog {
  .update-task-link-hint {
    margin: 0 0 12px;
    color: var(--el-text-color-secondary);
    font-size: 13px;
    line-height: 1.5;
  }
}
</style>
