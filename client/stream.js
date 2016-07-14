import { Meteor } from 'meteor/meteor';

class stream {
  constructor () {
    this._subs = {
      onReady: {},
      onStop: {}
    };
  }
  onReady (subId, callback) {
    this._subs.onReady[subId] = callback;
  }
  onStop (subId, callback) {
    this._subs.onStop[subId] = callback;
  }
  subReady (subId) {
    const readyCallback = this._subs.onReady[subId];
    readyCallback && readyCallback();
  }
  subStopped (subId) {
    const readyCallback = this._subs.onStop[subId];
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
  else if (message.msg === 'nosub') {
    Stream.subStopped(message.id);
  }
});

export default Stream;