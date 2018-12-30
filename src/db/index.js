import AV from 'leancloud-storage'
import Todo from './module'

AV.init({
  appId: 'iYzWnL2H72jtQgNQPXUvjFqU-gzGzoHsz',
  appKey: 'OR3zEynwWJ7f8bk95AdiGFzJ'
})

// const KEY = 'misstodologinuser'
// const localUser = localStorage.getItem(KEY)
const user = AV.User.current()

export default {
  user: user && { ...user.toJSON(), self: user },

  login(data) {
    return AV.User.logIn(data.name, data.pwd).then(res => {
      const data = AV.User.current()
      this.user = { ...data.toJSON(), self: data }
      return res.toJSON()
    }).catch(err => {
      return Promise.reject(err)
    })
  },

  logOut() {
    AV.User.logOut()
  },

  async insert (data) {
    const authenticated = await this.user.self.isAuthenticated()
    if (authenticated) {
      return new Todo(data).save().then(res => {
        return res.toJSON()
      })
    }
    return Promise.reject('登录失效')
  },

  getList (start, end) {
    return new AV.Query(Todo)
      .equalTo('userId', this.user.objectId)
      .greaterThanOrEqualTo('start', start)
      .lessThanOrEqualTo('end', end)
      .descending('updatedAt').find()
  },

  delete(id) {
    const todo = AV.Object.createWithoutData('TodoListPro', id)
    return todo.destroy()
  }
}
