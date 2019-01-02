<template>
  <div class="home">
    <calendar
      ref="calendar"
      :getPlan="getPlan"
      @edit-plan="editPlan"
      @look-plan-list="lookPlanList"
    >
      <div class="home__logo" slot="left">
        <h1>
          Miss清单
          <span class="home__logo--sub">Pro</span>
          <span class="home__logo--info">至简、至臻</span>
        </h1>
      </div>
      <div class="home__self" slot="right">
        <span v-if="!loginUser" class="dropdown-link color-blue" @click="toLogin">未登录</span>
        <dropdown v-else @command="clickMenu" trigger="click">
          <span class="dropdown-link">
            {{ loginUser.username }}
            <icon class="el-icon-arrow-down"></icon>
          </span>
          <dropdown-menu slot="dropdown">
            <dropdown-item
              command="add"
            ><icon class="el-icon-plus"></icon> 新建任务</dropdown-item>
            <dropdown-item
              command="logout"
            ><icon class="el-icon-refresh"></icon> 退出登录</dropdown-item>
          </dropdown-menu>
        </dropdown>
      </div>
    </calendar>

    <el-dialog
      :title="edit ? '编辑任务' : '新建任务'"
      :top="planDialogTop"
      :visible.sync="dialogVisible"
      width="500px"
      :close-on-click-modal="false"
      :before-close="handleClose">
      <el-form ref="planForm" :model="form" :rules="planRules" label-width="80px">
        <el-form-item label="任务名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入"></el-input>
        </el-form-item>
        <el-form-item label="开始时间">
          <el-date-picker
            v-model="dateRange"
            :clearable="false"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="yyyy/MM/dd"
            style="width: 100%;"
            @change="onDateChange"
          />
        </el-form-item>
        <el-form-item label="选择时刻">
          <el-col :span="11">
            <el-select :clearable="false" v-model="form.startTime" placeholder="请选择">
              <el-option
                v-for="item in options"
                :key="item.value"
                :label="item.label"
                :value="item.value">
              </el-option>
            </el-select>
          </el-col>
          <el-col style="text-align: center" :span="2">-</el-col>
          <el-col :span="11">
            <el-select :clearable="false" v-model="form.endTime" placeholder="请选择">
              <el-option
                v-for="item in options"
                :key="item.value"
                :label="item.label"
                :value="item.value">
              </el-option>
            </el-select>
          </el-col>
        </el-form-item>
        <el-form-item label="选择颜色">
          <color-picker
            v-model="form.color"
            show-alpha
            size="mini"
            :predefine="predefineColors">
          </color-picker>
          <span class="color-notice">建议选择预置颜色，颜色要淡，不要重复</span>
        </el-form-item>
        <el-form-item label="优先级">
          <el-input-number
            v-model="form.level"
            @change="handleChangeLevel"
            :min="1"
            :max="10"
            disabled
            label="任务优先级"
            size="mini"
          />
          <span class="color-notice">暂不支持修改</span>
        </el-form-item>
        <el-form-item label="任务详情">
          <el-input placeholder="任务过程记录，问题，描述等" :rows="5" type="textarea" v-model="form.detail"/>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button v-if="edit" type="danger" @click="del">删 除</el-button>
        <el-button v-else @click="resetForm('planForm')">重 置</el-button>
        <el-button type="primary" @click="commonSubmitForm('planForm')">确 定</el-button>
      </span>
    </el-dialog>

    <el-dialog
      title="登录系统"
      :visible.sync="loginVisible"
      :close-on-click-modal="false"
      width="400px">
      <el-form :rules="loginRules" ref="loginForm" :model="loginForm" label-width="80px">
        <el-form-item label="用户名" prop="name">
          <el-input placeholder="请输入" v-model="loginForm.name"/>
        </el-form-item>
        <el-form-item label="密码" prop="pwd">
          <el-input class="bindEnterKey" placeholder="请输入，回车键登录" v-model="loginForm.pwd"/>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="loginVisible = false">取 消</el-button>
        <el-button @click="resetForm('loginForm')">重 置</el-button>
        <el-button type="primary" @click="commonSubmitForm('loginForm')">登 录</el-button>
      </span>
    </el-dialog>

    <el-dialog
      title="任务列表"
      :visible.sync="planListVisible"
      width="400px">
      <div class="look-plan-list">
        <div
          v-for="item in dialogPlanList"
          :key="item.objectId"
          class="look-item"
          :style="{
            backgroundColor: item.color
          }"
          @click="toLookDetail(item)"
        >
          <span>{{ item.startTime }}</span>
          <span>{{ item.name }}</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import Calendar from '../components/Calendar'
import db from '../db'
import {
  icon,
  dropdown,
  dropdownMenu,
  dropdownItem,
  dialog,
  button,
  form,
  FormItem,
  input,
  col,
  DatePicker,
  Select,
  Option,
  ColorPicker,
  InputNumber
} from 'element-ui'

// https://htmlcolorcodes.com/zh/
const colorList = [
  '#FEF9E7',
  '#eef5fe',
  '#EAFAF1',
  '#E9F7EF',
  '#F4ECF7',
  '#FDF2E9',
  '#EBEDEF'
]

const defaultTime = [
  { value: '上午', label: '上午' },
  { value: '下午', label: '下午' },
]

export default {
  name: 'home',

  data() {
    return {
      dialogVisible: false,
      loginVisible: false,
      planListVisible: false,
      dateRange: '',
      form: {
        name: '',
        start: '',
        startTime: defaultTime[0].value,
        end: '',
        endTime: defaultTime[1].value,
        color: colorList[Math.floor(Math.random()*7)],
        detail: '',
        level: 1
      },
      planRules: {
        name: [
          { required: true, message: '请输入任务名称', trigger: 'blur' },
          { min: 3, max: 100, message: '长度在 3 到 100 个字符', trigger: 'blur' }
        ],
        detail: [
          { message: '任务详情不合法', trigger: 'blur' },
          { min: 0, max: 1000, message: '长度在 0 到 1000 个字符', trigger: 'blur' }
        ]
      },
      planDialogTop: '',
      dialogPlanList: [],

      options: defaultTime,
      predefineColors: colorList,
      edit: null,
      loginUser: db.user,

      loginForm: {
        name: '',
        pwd: ''
      },
      loginRules: {
        name: [
          { required: true, message: '请输入用户名', trigger: 'blur' },
          { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
        ],
        pwd: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur' }
        ]
      },

      enterKeyInputElem : null,
      docHeight: 0
    }
  },

  components: {
    Calendar,
    dropdown,
    dropdownMenu,
    dropdownItem,
    icon,
    ElDialog: dialog,
    ElButton: button,
    ElForm: form,
    ElFormItem: FormItem,
    elInput: input,
    ElSelect: Select,
    ElOption: Option,
    ElCol: col,
    ElDatePicker: DatePicker,
    ColorPicker,
    ElInputNumber: InputNumber
  },

  watch: {
    loginVisible(val) {
      if (val && !this.enterKeyInputElem) {
        this.$nextTick(() => {
          this.enterKeyInputElem = document.querySelector('.bindEnterKey').querySelector('input')
          this.enterKeyInputElem.addEventListener('keyup', e => {
            if (e.keyCode === 13) {
              this.login()
            }
          })
        })
      }
    }
  },

  mounted() {
    const { clientHeight } = document.documentElement
    this.docHeight = clientHeight
    this.planDialogTop = `${(clientHeight - 640) / 2}px`
  },

  methods: {
    clickMenu(e) {
      if (e === 'add') {
        this.edit = null
        // 得到当前日期的最小level
        const { selectedDate } = this.$refs.calendar
        this.dateRange = [selectedDate.valueOf(), selectedDate.valueOf()]
        this.form.color = colorList[Math.floor(Math.random()*7)]
        this.onDateChange(this.dateRange)
        if (this.form.level === 10) {
          this.$message.error('每天的任务最多为9条')
        } else {
          this.dialogVisible = true
        }
      } else {
        db.logOut()
        // this.loginUser = null
        location.reload()
      }
    },

    handleClose(done) {
      done()
      // this.$confirm('确认关闭？').then(done)
    },

    handleChangeLevel() {
    },

    editPlan(plan) {
      this.dialogVisible = true
      this.edit = plan
      Object.keys(this.form).forEach(key => {
        this.form[key] = plan[key]
      })
      this.dateRange = [plan.start.valueOf(), plan.end.valueOf()]
    },

    async submitForm() {
      this.$loading.open()
      if (this.edit) {
        let res
        const req = {
          ...this.form,
          start: this.form.start.valueOf(),
          end: this.form.end.valueOf()
        }
        if (this.edit.self) {
          // 走module编辑
          res = await Object.assign(this.edit.self, req).save()
        } else {
          // 走最原始的编辑
          res = await db.update(this.edit.objectId, req)
        }
        this.$refs.calendar.updatePlan(res)
        this.dialogVisible = false
        this.$message.success('编辑成功')
      } else {
        const res = await db.insert({ ...this.form, userId: this.loginUser.objectId })
        this.$refs.calendar.pushPlan(res)
        this.dialogVisible = false
        this.$message.success('新建成功')
      }
      this.$loading.close()
    },

    getPlan(start, end) {
      return db.getList(start.valueOf(), end.valueOf())
    },

    onDateChange(data) {
      // 编辑时需要考虑去掉自身这一条
      this.form.level = this.$refs.calendar.getLevel(data, this.edit)
      const isDate = data[0] instanceof Date
      this.form.start = isDate ? data[0].getTime() : data[0]
      this.form.end = isDate ? data[1].getTime() : data[0]
    },

    del() {
      this.$confirm('确认删除吗？').then(() => {
        this.$loading.open()
        const id = this.edit.objectId
        db.delete(id).then(() => {
          this.$message.success('删除成功')
          this.$refs.calendar.delPlan(id)
          this.dialogVisible = false
          this.$loading.close()
        })
      })
    },

    toLogin() {
      this.loginVisible = true
    },

    async login() {
      this.$loading.open()
      await db.login(this.loginForm).catch(err => {
        this.$loading.close()
        this.$message.error(err.error || err.message)
      })
      this.$loading.close()
      this.loginUser = db.user
      this.loginVisible = false
      // 拉数据
      this.$refs.calendar.dealOriginPlan()
    },

    commonSubmitForm(formName) {
      this.$refs[formName].validate((valid) => {
        if (valid) {
          if (formName === 'loginForm') {
            this.login()
          } else {
            this.submitForm()
          }
        }
      })
    },

    resetForm(formName) {
      this.$refs[formName].resetFields()
    },

    lookPlanList(planList) {
      this.dialogPlanList = planList || []
      this.planListVisible = true
    },

    toLookDetail(item) {
      this.dialogPlanList = []
      this.planListVisible = false
      this.editPlan(item)
    }
  }
}
</script>

<style lang="stylus">
.home
  &__logo,
  &__self
    width 300px
  &__logo
    h1
      display flex
      align-items baseline
      font-size 24px
    &--sub
      color #666
      font-size 14px
    &--info
      margin-left 10px
      color #999
      font-size 10px
  &__self
    text-align right

  .dropdown-link
    cursor pointer
    font-size 12px
  .el-form-item__content
    display flex
    align-items center
  .color-notice
    font-size: 10px;
    color: #999;
    margin-left: 10px;
  .color-blue
    color #488ff9
  .look-plan-list
    .look-item
      padding 3px 5px
      margin-bottom 5px
      white-space nowrap
      overflow hidden
      text-overflow ellipsis
      cursor: pointer
      span:first-child
        color #488ff9
        margin-right 5px
      span:last-child
        //
</style>
