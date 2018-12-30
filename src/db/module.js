import AV from 'leancloud-storage'

class Todo extends AV.Object {
  get name () { return this.get('name') }
  set name (value) { this.set('name', value) }

  get color () { return this.get('color') }
  set color (value) { this.set('color', value) }

  get start () { return this.get('start') }
  set start (value) { this.set('start', value) }

  get end () { return this.get('end') }
  set end (value) { this.set('end', value) }

  get startTime () { return this.get('startTime') }
  set startTime (value) { this.set('startTime', value) }

  get endTime () { return this.get('endTime') }
  set endTime (value) { this.set('endTime', value) }

  get detail () { return this.get('detail') }
  set detail (value) { this.set('detail', value) }

  get level () { return this.get('level') }
  set level (value) { this.set('level', value) }

  get userId () { return this.get('userId') }
  set userId (value) { this.set('userId', value) }
}

AV.Object.register(Todo, 'TodoListPro')
export default Todo
