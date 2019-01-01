<template>
  <div class="calendar">
    <div class="calendar__month-bar">
      <slot name="left" />
      <div class="calendar__month">
        <span class="calendar__handle" @click="changeMonth('decrease')">
          <icon class="el-icon-arrow-left" />
        </span>
        <span>{{ currentMonth.format('YYYY年MM月') }}</span>
        <span class="calendar__handle" @click="changeMonth('add')">
          <icon class="el-icon-arrow-right" />
        </span>
      </div>
      <slot name="right"></slot>
    </div>
    <div class="calendar__date">
      <div class="calendar__group">
        <div
          v-for="(item, i) in week"
          :key="`week${i}`"
          class="calendar__item calendar__item--title"
        >
          {{ item }}
        </div>
      </div>
      <div
        v-for="(arr, i) in spliceSeven(dateList).slice(0, totalLine)"
        :key = i
        class="calendar__group"
      >
        <div
          v-for="(item, j) in arr"
          :key="`date${j}`"
          class="calendar__item"
          :class="{
            'calendar__item--selected': isSelected(item),
            'calendar__item--selected-before': isSelectedBefore(item),
            'calendar__item--current': isCurrentDay(item)
          }"
          :style="{
            'height': `${calendarItemHeight}px`
          }"
          @click="selectDate(item)"
        >
          <div class="calendar__item--word-title">
            <div class="calendar__holiday">
              <span class="calendar__item--word">{{ item.format('DD') }}</span>
              <template v-if="getHoliday(item)">
                <span
                  v-if="getHoliday(item).tip"
                  class="calendar__holiday--tip"
                  :class="{
                    'calendar__holiday--tip-green': getHoliday(item).data
                  }"
                >
                  {{ getHoliday(item).tip }}
                </span>
                <span
                  v-if="getHoliday(item).name"
                  class="calendar__holiday--name"
                >
                  {{ getHoliday(item).name }}
                </span>
              </template>
            </div>
            <span
              v-if="getDatePlan(item).length >= 3"
              class="calendar__item--word-num"
              @click="handleClickTotalPlan(item)"
            >
              共{{ getDatePlan(item).length }}条
            </span>
          </div>
          <div class="calendar__plan">
            <div
              v-for="planItem in getDatePlan(item)"
              v-if="planItem.level <= planTotalLine"
              :key="planItem.objectId"
              class="calendar__plan--item"
              :class="{
                [`calendar__plan--item-level${planItem.level}`]: true,
                'calendar__plan--item-start': isPlanHeadTail(planItem, item, 'head'),
                'calendar__plan--item-end': isPlanHeadTail(planItem, item, 'tail')
              }"
              :style="{
                backgroundColor: planItem.color
              }"
              @click="clickPlan(planItem)"
            >
              <template v-if="showPlan(planItem, item)">
                <span class="calendar__plan--item-tag">{{ planItem.startTime }}</span>
                <span>{{ planItem.name }}</span>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import dayjs from 'dayjs'
import plan from './plan'
import { Icon } from 'element-ui'
import holiday from './holiday'

export default {
  name: 'calendar',

  components: {
    Icon
  },

  filters: {
  },

  mixins: [plan],

  data() {
    return {
      currentMonthIndex: 0,
      now: dayjs(),
      selectedDate: dayjs(),
      dateList: new Array(6 * 7),
      week: ['一', '二', '三', '四', '五', '六', '日'],
      totalLine: 0  // 展示的总行数
    }
  },

  computed: {
    currentMonth() {
      if (this.currentMonthIndex === 0) {
        return this.now
      } else if (this.currentMonthIndex > 0) {
        return this.now.add(this.currentMonthIndex, 'month')
      } else {
        return this.now.subtract(-this.currentMonthIndex, 'month')
      }
    },

    selectedBeforeDate() {
      const first = this.dateList[0]
      // 第一天是选中的
      if (first && first.format('YYYYMMDD') === this.selectedDate.format('YYYYMMDD')) {
        return null
      }
      return this.selectedDate.subtract(1, 'day')
    },

    calendarItemHeight() {
      return this.totalLine ? Math.floor((this.$parent.docHeight - 80) / this.totalLine) : 0
    }
  },

  created() {
    this.computedDate()
    this.dealOriginPlan()
  },

  watch: {
    currentMonthIndex() {
      this.computedDate()
      this.dealOriginPlan()
    }
  },

  methods: {
    getHoliday(date) {
      const year = date.year()
      const day = date.format('MMDD')
      return holiday[year] && holiday[year][day]
    },

    computedDate() {
      const start = this.currentMonth.startOf('month')
      const end = this.currentMonth.endOf('month')
      let indexDate = start
      let base = 0
      let index = 0
      let startIndex
      let endIndex
      while (indexDate.valueOf() < end.valueOf()) {
        let tmpDay = indexDate.day()
        // 周日为7
        tmpDay = tmpDay === 0 ? 7 : tmpDay
        // 获取数组索引
        index = tmpDay - 1 + base * 7
        if (tmpDay % 7 === 0) {
          base += 1
        }
        if (base === 0) {
          startIndex = index
        } else {
          // 只展示base + 1行数据
          endIndex = index
        }
        // 填充本月数组
        this.dateList[index] = indexDate
        indexDate = indexDate.add(1, 'day')
      }
      this.totalLine = base + 1
      // 补充当月首位,末尾
      this.fillStartEnd(startIndex - 1, endIndex + 1)
    },

    spliceSeven(arr) {
      // 拆分为2为数组，长度为7，数量为num
      let result = []
      let start
      for (let i = 0; i < 7; i++) {
        start = 7 * i
        result.push(arr.slice(start, 7 + start))
      }
      return result
    },

    fillStartEnd(startIndex, endIndex) {
      if (startIndex >= 0) {
        for (let i = startIndex; i >= 0; i--) {
          this.dateList[i] = this.dateList[i + 1].subtract(1, 'day')
        }
      }
      if (endIndex <= this.dateList.length - 1) {
        for (let i = endIndex; i < this.dateList.length; i++) {
          this.dateList[i] = this.dateList[i - 1].add(1, 'day')
        }
      }
    },

    isSelected(item) {
      return this.selectedDate.format('YYYY/MM/DD') === item.format('YYYY/MM/DD')
    },

    isSelectedBefore(item) {
      if (this.selectedBeforeDate) {
        return this.selectedBeforeDate.format('YYYY/MM/DD') === item.format('YYYY/MM/DD')
      }
      return false
    },

    isCurrentDay(item) {
      return this.now.format('YYYY/MM/DD') === item.format('YYYY/MM/DD')
    },

    selectDate(item) {
      this.selectedDate = item
      // 如果选择的月份和当月不一致
      const currentTs = this.currentMonth.format('YYYY/MM/DD').valueOf()
      const itemTs = item.format('YYYY/MM/DD').valueOf()
      const currentMonth = this.currentMonth.month()
      const itemMonth = item.month()
      if (currentMonth !== itemMonth) {
        if (itemTs < currentTs) {
          this.currentMonthIndex -= 1
        } else if (currentTs < itemTs) {
          this.currentMonthIndex += 1
        }
      }
    },

    changeMonth(type) {
      const isAdd = type === 'add'
      if (isAdd) {
        this.currentMonthIndex++
      } else {
        this.currentMonthIndex--
      }
    },

    handleClickTotalPlan(item) {
      this.$emit('look-plan-list', this.getDatePlan(item), item)
    }
  }
}
</script>

<style lang="stylus">
  .calendar
    &__month-bar
      display flex
      justify-content space-between
      align-items center
      height 50px
      padding 0 20px
    &__month
      display flex
      justify-content center
      align-items center
    &__handle
      width 50px
      text-align center
      cursor pointer
    &__date
      border-left 1px #f2f2f2 solid
      border-top 1px #f2f2f2 solid
    &__group
      display flex
      justify-content space-between
    &__item
      position relative
      width 400px
      height 100px
      border-right 1px #f2f2f2 solid
      border-bottom 1px #f2f2f2 solid
      &--selected
        background-color: #fff
        box-shadow 0 0 10px rgba(0,0,0,.2)
        border-right none
        &-before
          z-index 50
          border-right none
      &--current
        & ^[1]--word
          width 25px
          height 25px
          background-color red
          color #fff
      &--title
        display flex
        justify-content center
        align-items center
        height 30px
        background-color #f9f9f9
      &--word
        width 20px
        height 20px
        display flex
        justify-content center
        align-items center
        border-radius 50%
        // margin 3px 0 0 3px
        color #666
        &-title
          display flex
          justify-content space-between
          align-items center
          padding 3px 0 0 3px
        &-num
          color #488ff9
          font-size 12px
          margin-right 3px
          cursor pointer
    &__holiday
      display flex
      justify-content center
      align-items center
      &--tip
        display flex
        justify-content: center
        align-items center
        color #fff
        font-size 10px
        width 16px
        height 16px
        border-radius 50%
        background-color #f53939
        margin-left 10px
        &-green
          background-color #2dc888
      &--name
        font-size 10px
        margin-left 5px
        color #488ff9
    // 日历任务
    &__plan
      position absolute
      top 30px
      // height 66px
      width 100%
      font-size 12px
      &--item
        position absolute
        // width 100%
        left 0
        right 0
        height 20px
        line-height 20px
        // background-color #eef5fe
        white-space nowrap
        overflow hidden
        text-overflow ellipsis
        cursor pointer
        &-tag
          color #488ff9
          margin 0 3px
        &-level1
          top 0
        &-level2
          top 23px
        &-level3
          top 23 * 2px
        &-level4
          top 23 * 3px
        &-level5
          top 23 * 4px
        &-level6
          top 23 * 5px
        &-level7
          top 23 * 6px
        &-level8
          top 23 * 7px
        &-level9
          top 23 * 8px
        &-start
          left 3px
        &-end
          right 3px
</style>
