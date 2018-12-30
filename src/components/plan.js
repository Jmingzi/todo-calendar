import dayjs from 'dayjs'
import db from '../db'

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
  },

  created() {
  },

  methods: {
    async dealOriginPlan() {
      if (!db.user) {
        return Promise.reject('未登录')
      }
      this.$loading.open()
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

    transferPlanItem(data) {
      const item = data.toJSON ? data.toJSON() : { ...data }
      item.self = data
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

    getDatePlan(date) {
      const tmp = date.format('YYYY/MM/DD')
      if (!this.datePlanCache[tmp]) {
        const result = this.plan.map(x => {
          // console.log(x.dateList.some(y => y === tmp), tmp)
          if (x.dateList.some(y => y === tmp)) {
            return x
          }
        }).filter(x => x)
        this.datePlanCache[tmp] = result.length && result
      }
      return this.datePlanCache[tmp]
    },

    isPlanHeadTail(plan, date, type) {
      const isHead = type === 'head'
      const tmp = date.format('YYYY/MM/DD')
      const item = this.datePlanCache[tmp]
      if (item) {
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
      const last = plan.dateList[plan.dateList.length - 1]
      const hasExpire = dayjs(last).valueOf() < this.now.valueOf()
      return this.isSelected(date) ||
        // hasExpire ||
        this.isPlanHeadTail(plan, date, 'head')
    },

    clickPlan(plan) {
      this.$emit('edit-plan', plan)
    },

    getLevel(dateRange, editItem) {
      let level = 1
      let start = dayjs(dateRange[0])
      const end = dayjs(dateRange[1])
      let i = 0
      while (start.valueOf() <= end.valueOf() && i < 5) {
        const plan = this.getDatePlan(start)
        if (plan) {
          // 在plan中需要将编辑的这一条剔除
          if (editItem) {
            const i = plan.findIndex(x => x.objectId === editItem.objectId)
            plan.splice(i, 1)
          }
          level = level < plan.length + 1 ? (plan.length + 1) : level
        }
        start.add(1, 'day')
        i++
      }
      return level
    },

    pushPlan(data) {
      // 更新缓存
      this.datePlanCache = {}
      this.plan.push(this.transferPlanItem(data))
    },

    delPlan(id) {
      const i = this.plan.findIndex(x => x.objectId === id)
      this.datePlanCache = {}
      this.plan.splice(i, 1)
    },

    updatePlan(data) {
      this.datePlanCache = {}
      const trans = this.transferPlanItem(data)
      const i = this.plan.findIndex(x => x.objectId === trans.objectId)
      this.plan.splice(i, 1, trans)
    }
  }
}
