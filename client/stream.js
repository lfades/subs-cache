import { Meteor } from 'meteor/meteor';

class stream {
  constructor () {
    this._subs = {};
  }
  on (subId, callback) {
    this._subs[subId] = callback;
  }
  subReady (subId) {
    const readyCallback = this._subs[subId];
    readyCallback && readyCallback();
  }
}
Stream = new stream();

Meteor.connection._stream.on('message', function (msg) {
  const message = JSON.parse(msg);
  if (message.msg === 'ready') {
    _.each(message.subs, sub => {
      Stream.subReady(sub);
    });
  }
});