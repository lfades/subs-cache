class SubsCache {
  constructor () {}
  subscribe (...params) {
    return Meteor.subscribe(...params);
  }
};
export default SubsCache;