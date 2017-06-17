const _ = require('lodash');
const { 
  github, backoff, wait, batchPromises, 
  transactionCreator,
} = require('./utils');

const pause = 10 * 1000;

function listFollowers(options, cb) {
  if (typeof options === 'function') {
      cb = options;
      options = {};
  }
  options = this._getOptionsWithDefaults(options);
  return this._requestAllPages(this.__getScopedUrl('followers'), options, cb);
}

const getUserMetrics = u => {
  let user = github.getUser(u.login);
  console.log(`getUserMetrics: process ${u.login}`);

  const requests = [
    backoff(() => user.listRepos({})), 
    backoff(() => user.listGists()),
    backoff(() => listFollowers.call(user, {})),
  ];
  return Promise.all(requests)
    .then(([repos, gists, followers]) => ({
      userToRepos: repos.data.length + gists.data.length,
      userToFollowers: followers.data.length,
    }));
};

module.exports = require('./base')
  ('user', (message, { datastore: ds, pubsub: ps, }) => {
  const { user, repoId, contribution, } = message;
  console.log(`user: process ${user.login}`);

  const tran = transactionCreator(ds);
  const userKey = id => ds.key(['User', id]);
  const key = userKey(user.id);

  return Promise.resolve()
    .then(() => wait(pause))
    .then(() => {
      console.log(`user: get metrics for ${user.login}`);
      return getUserMetrics(user)
    })
    .then((metrics) => {
      console.log(`user: trying to save ${user.login}`);
      return backoff(() => 
        tran(key, user => _.merge(user, {
          repos: {
            [repoId]: contribution,
          },
        }, metrics)));
    });
});
