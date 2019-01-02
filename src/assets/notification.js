export default (message) => {
  const ins = new Notification('任务提醒', {
    dir: 'ltr',
    body: message,
    icon: ''
  })
  ins.onclick = () => {
    window.focus()
    ins.close()
  }
}
