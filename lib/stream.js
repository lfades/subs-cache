class stream {
  constructor () {
    this._subs = {}
  }
  on (subId, callback) {
    this._subs[subId] = callback
  }
  subReady (subId) {
    let readyCallback = this._subs[subId]
    readyCallback && readyCallback()
  }
}
Stream = new stream()

Meteor.connection._stream.on('message', function (msg) {
  let message = JSON.parse(msg)
  if (message.msg === 'ready') {
    _.each(message.subs, function (sub) {
      Stream.subReady(sub)
    })
  }
})