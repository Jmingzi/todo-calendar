import dayjs from 'dayjs'
import db from '../db'
// import Todo from '../db/module';

export default {
  data() {
    return {
      plan: [],
      datePlanCache: {}
    }
  },

  props: {
    getPlan: {
      type: Function
    }
  },

  computed: {
    // 展示的任务条数
    planTotalLine() {
      return this.calendarItemHeight
        ? Math.floor((this.calendarItemHeight - 28) / 23)
        : 0
    }
  },

  created() {
  },

  methods: {
    /**
     * 获取任务列表
     * @returns {Promise<never>}
     */
    async dealOriginPlan() {
      if (!db.user) {
        return Promise.reject('未登录')
      }
      this.$loading.open()
      this.datePlanCache = {}
      const res = await this.getPlan(this.dateList[0], this.dateList[this.dateList.length - 1]).catch(err => {
        if (err.code) {
          console.log('未登录')
        }
      })
      this.$loading.close()
      if (res) {
        this.plan = res.map(item => this.transferPlanItem(item))
      }
    },

    /**
     * 转换原始任务数据为可用
     * @param data
     * @returns {{}}
     */
    transferPlanItem(data) {
      const item = data.toJSON ? data.toJSON() : { ...data }
      // 保存原型引用
      item.self = data.toJSON ? data : undefined
      item.start = dayjs(item.start)
      item.end = dayjs(item.end)
      // 将日期字符存入数组
      item.dateList = []
      let cur = item.start
      while (cur.valueOf() <= item.end.valueOf()) {
        item.dateList.push(cur.format('YYYY/MM/DD'))
        cur = cur.add(1, 'day')
      }
      return item
    },

    /**
     * 获取当天的任务并缓存
     * @param date
     * @returns {*}
     */
    getDatePlan(date) {
      const tmp = date.format('YYYY/MM/DD')
      if (!this.datePlanCache[tmp]) {
        const result = this.plan.map(x => {
          if (x.dateList.some(y => y === tmp)) {
            return x
          }
        }).filter(x => x)
        // this.datePlanCache[tmp] = result.length && result
        return result.length && result
      }
      return []
      // return this.datePlanCache[tmp]
    },

    /**
     * 是否是任务的头部和尾部
     * @param plan
     * @param date
     * @param type
     * @returns {*}
     */
    isPlanHeadTail(plan, date, type) {
      const isHead = type === 'head'
      const tmp = date.format('YYYY/MM/DD')
      // const item = this.datePlanCache[tmp]
      const item = this.getDatePlan(date)
      if (item && item.length) {
        const pl = item.find(x => x.objectId === plan.objectId)
        return pl && pl.dateList && pl.dateList[isHead ? 0 : pl.dateList.length - 1] === tmp
      }
      return false
    },

    /**
     * 是否显示任务
     * 任务第一条 及 选中
     * @param plan
     * @param date
     * @returns {*|boolean}
     */
    showPlan(plan, date) {
      // 计划的最后一天小于今天
      // const last = plan.dateList[plan.dateList.length - 1]
      // const hasExpire = dayjs(last).valueOf() < this.now.valueOf()
      return this.isSelected(date) ||
        // hasExpire ||
        this.isPlanHeadTail(plan, date, 'head')
    },

    clickPlan(plan) {
      this.$emit('edit-plan', plan)
    },

    /**
     * 创建任务时，计算得到可用level
     * @param dateRange
     * @param editItem
     * @returns {number}
     */
    getLevel(dateRange, editItem) {
      let level = 1
      let start = dayjs(dateRange[0])
      const end = dayjs(dateRange[1])
      while (start.valueOf() <= end.valueOf()) {
        const plan = this.getDatePlan(start)
        if (plan && plan.length) {
          // 在plan中需要将编辑的这一条剔除
          if (editItem) {
            const i = plan.findIndex(x => x.objectId === editItem.objectId)
            plan.splice(i, 1)
          }
          if (plan.length) {
            // 1~9
            const planLevelList = plan.map(x => x.level)
            const remainLevel = []
            for (let j = 1; j < 10; j++) {
              if (planLevelList.every(x => x !== j)) {
                remainLevel.push(j)
              }
            }
            // 取最小值
            const min = Math.min.apply(null, remainLevel)
            level = level < min ? min : level
          }
        }
        start = start.add(1, 'day')
      }
      return level
    },

    // 添加任务成功后，更新列表
    // 因为编辑时用的module方式
    // 添加的任务不存在prototype引用
    pushPlan(data) {
      this.datePlanCache = {}
      this.plan.push(this.transferPlanItem(data))
    },

    delPlan(id) {
      const i = this.plan.findIndex(x => x.objectId === id)
      this.datePlanCache = {}
      if (i > -1) {
        this.plan.splice(i, 1)
      } else {
        this.$message.error('删除本地plan失败')
      }
    },

    updatePlan(data) {
      this.datePlanCache = {}
      const trans = this.transferPlanItem(data)
      const i = this.plan.findIndex(x => x.objectId === trans.objectId)
      if (i > -1) {
        this.plan.splice(i, 1, trans)
      } else {
        this.$message.error('更新本地任务失败')
      }
    }
  }
}
