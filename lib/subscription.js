SubCache = class subCache {
  constructor (cache, name) {
    this.cache = cache
    this.name = name

    this._subscribing = false
    this._collections = {}
    this._subs = {}
    this._onSub = new Tracker.Dependency
    
    this._params = new ReactiveVar()
    this._history = {}
    this._subHistory = []
  }
  find (collection, ...params) {
    return this.get(collection).find(...params)
  }
  findOne (collection, ...params) {
    return this.get(collection).findOne(...params)
  }
  subscribe (...params) {
    let callbacks = {},
    lastParam = params[params.length -1]

    if (_.isFunction(lastParam))
      callbacks.onReady = params.pop()
    else if (lastParam &&
      _.any([lastParam.onReady, lastParam.onStop], _.isFunction)
    ) callbacks = params.pop()

    let JSONParams = JSON.stringify(params)
    
    this._subscribing = true
    this._subReady = false
    this._subParams = JSONParams
    this._subHistory.push(JSONParams)

    if (this._history[JSONParams]) {
      this._subReady = true
      this._params.set(this._subParams)
    }
    this._history[JSONParams] = (new Date()).getTime()

    if (this._sub) this._sub.stop()
    this._onSub.changed()
    
    let noLongerExist = this.noLongerExist(JSONParams),
    ready = false,
    sub = Meteor.subscribe(this.name, ...params, {
      onReady: () => {
        this._next = null
        this._subHistory = []
        this._subscribing = false
        
        if (!ready) {
          ready = true
          this._subReady = true
          this._params.set(this._subParams)
        }

        this.cache._removeOld()
        noLongerExist.remove()

        callbacks.onReady && callbacks.onReady()
      },
      onStop: (error) => {
        this._sub = null
        
        if (ready) {
          this._next = this._subHistory.shift()
          this._subReady = false
        } else {
          // Sometimes the subscription is canceled before it is ready
          Stream.on(sub.subscriptionId, () => {
            this._next = this._subHistory.shift()
          })
        }

        callbacks.onStop && callbacks.onStop(error)
      }
    })

    this._sub = sub
    return sub
  }
  noLongerExist (JSONParams) {
    return Tracker.nonreactive(() => {
      let current = {}
      _.each(this._collections, (cache, name) => {
        current[name] = cache.collection.find({_to: JSONParams}).map(doc => doc._id)
      })

      return {
        remove: () => {
          _.each(current, (_ids, name) => {
            if (!_ids.length) return

            let cache = this._collections[name],
            docs = cache.parentColl.find({_id: {$in: _ids}}).map(doc => doc._id)
            
            if (docs.length < _ids.length)
              cache.collection.remove({_id: {$in: _.difference(_ids, docs)}})
          })
        }
      }
    })
  }
  get (collection) {
    var name = collection._collection.name
    return this._collections[name]
      || (this._collections[name] = new CollectionCache(this, collection))
  }
}