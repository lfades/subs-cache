import { Meteor } from 'meteor/meteor';
import { _ } from 'meteor/underscore';
import { Mongo } from 'meteor/mongo';
import { Tracker } from 'meteor/tracker';
import { ReactiveVar } from 'meteor/reactive-var';
import CollectionCache from './collection';
import Stream from './stream';

class SubCache {
  constructor (cache, name) {
    this.cache = cache;
    this.name = name;

    this._collections = {};
    this._onSub = new Tracker.Dependency;

    this._subReady = new ReactiveVar(true);
    this._history = {};

    this._subHistory = {
      history: [],
      push (params) {
        if (this._lastParams !== params) {
          this.history.push(params);
          this._lastParams = params;
        }
      },
      next () {
        return this.history.shift();
      }
    }
  }
  find (collection, ...params) {
    return this.get(collection).find(...params);
  }
  findOne (collection, ...params) {
    return this.get(collection).findOne(...params);
  }
  subscribe (...params) {
    let callbacks = {};
    const lastParam = params[params.length -1];

    if (_.isFunction(lastParam))
      callbacks.onReady = params.pop();
    else if (lastParam &&
      _.any([lastParam.onReady, lastParam.onStop], _.isFunction)
    ) callbacks = params.pop();

    const JSONParams = JSON.stringify(params);
    let subReady = false;
    let ready = false;

    this._subParams = JSONParams;
    this._params = new ReactiveVar();
    this._subHistory.push(JSONParams);

    if (this._history[JSONParams]) {
      subReady = true;
      this._params.set(this._subParams);
    }
    this._history[JSONParams] = (new Date()).getTime();

    this._onSub.changed();

    const noLongerExist = this.noLongerExist(JSONParams);
    const sub = Meteor.subscribe(this.name, ...params, {
      onReady: () => {
        if (!ready) {
          ready = true;
          subReady = true;
        }

        this.cache._removeOld();
        noLongerExist.remove();

        callbacks.onReady && callbacks.onReady();
      },
      onStop: (error) => {
        this._sub = null;
        this._subReady.set(false);

        if (ready) {
          this._next = this._subHistory.next();
          subReady = false;
        } else {
          // Sometimes the subscription is canceled before it is ready
          Stream.onReady(sub.subscriptionId, () => {
            this._next = this._subHistory.next();
          });
        }
        callbacks.onStop && callbacks.onStop(error);
      }
    });

    Stream.onStop(sub.subscriptionId, () => {
      this._subHistory.history = [];
      this._next = null;
      this._subReady.set(true);
    });
    this._sub = sub;

    return {
      ready: () => {
        return subReady || sub.ready();
      },
      stop () { return sub.stop(); },
      subscriptionId: sub.subscriptionId
    };
  }
  noLongerExist (JSONParams) {
    return Tracker.nonreactive(() => {
      const current = {};
      _.each(this._collections, (cache, name) => {
        current[name] = cache.collection.find({_to: JSONParams}).map(doc => doc._id);
      });

      return {
        remove: () => {
          _.each(current, (_ids, name) => {
            if (!_ids.length) return;

            const cache = this._collections[name];
            const docs = cache.parentColl.find({_id: {$in: _ids}}).map(doc => doc._id);

            if (docs.length < _ids.length)
              cache.collection.remove({_id: {$in: _.difference(_ids, docs)}});
          });
        }
      };
    });
  }
  get (collection) {
    const name = collection._collection.name;
    return this._collections[name]
      || (this._collections[name] = new CollectionCache(this, collection));
  }
};

export default SubCache;