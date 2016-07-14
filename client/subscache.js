import { _ } from 'meteor/underscore';
import SubCache from './subscription';

class SubsCache {
  constructor (options = {}) {
    this._collections = {};
    this._subscriptions = {};

    this._removeInterval = ((options.expireIn || 10) * 60 * 1000) || null;
    this._lastRemoveAt = this._removeInterval;

    if (options.inAll)
      this._searchInAll = true;
  }
  find (subName, collection, selector, options) {
    const coll = this.use(subName, collection);
    return coll ? coll.find(selector, options)
    : collection.find(selector, options);
  }
  findOne (subName, collection, selector, options) {
    const coll = this.use(subName, collection);
    return coll ? coll.findOne(selector, options)
    : collection.findOne(selector, options);
  }
  use (subName, parentColl) {
    const sub = this._subscriptions[subName]
    || (this._subscriptions[subName] = new SubCache(this, subName));
    return parentColl ? sub.get(parentColl): sub;
  }
  subscribe (...params) {
    return this.use(params.shift()).subscribe(...params);
  }
  ready (subName) {
    if (subName) {
      const sub = this._subscriptions[subName];
      return sub && sub._sub ? sub._sub.ready(): false;
    }
    return _.every(this._subscriptions, sub => sub._sub ? sub._sub.ready(): true);
  }
  _removeOld () {
    if (!this._removeInterval) return;

    const time = (new Date()).getTime() - this._removeInterval;

    if (this._lastRemoveAt > time) return;
    this._lastRemoveAt = time + this._removeInterval;

    _.each(this._subscriptions, (sub, subName) => {
      let params = sub._subParams;

      _.each(sub._collections, (c, name) => {
        if (!c.collection.remove({
          _to: {$ne: params},
          _toAt: {$lt: time}
        })) return;

        const history = sub._history;
        _.each(history, (at, _params) => {
          if (_params !== params && at < time) {
            delete history[_params];
            c.collection.update({_to: _params}, {
              $pull: {_to: _params}
            }, {multi: true});
          }
        });
      });
    });
  }
};

export default SubsCache;