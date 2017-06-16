const _ = require('lodash');
const datastore = require('@google-cloud/datastore');
const pubsub = require('@google-cloud/pubsub');
const GitHub = require('github-api');

const throttleDelay = 60 * 1000;

const github = new GitHub({
   token: '5f82fcd9c4164494c8453e5a13a98e25e3ee5eaa',
});


const batchPromises = (promiseCreators, chunkSize) =>
  Promise.resolve(_.chunk(promiseCreators, chunkSize))
    .then(chunks => chunks.reduce((acc, curr) => 
      acc.then(previous => Promise.all([
        ...previous, ...curr.map(request => request())
      ])), Promise.resolve([])));

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

const backoff = (promiseCreator, delay = 1000) => 
  promiseCreator()
    .catch((err) => {
      console.log('backoff', err);
      return wait(delay)
        .then(() => backoff(promiseCreator, delay * 2));
    });

let org = github.getOrganization('angular');

const updateRepoStat = (state, repo, data) => Object.assign(
  state, {
    repoToStats: Object.assign(state.repoToStats || {}, {
      [repo.id]: data.reduce(
        (acc, curr) => _.set(acc, curr.author.id, {
          total: curr.total,
          weeks: _.filter(curr.weeks, w => w && (w.a || w.d || w.c)),
        }), {}),
    }),
  });

const updateUserStat = (state, repo, data) => 
  data.reduce((state, data) => Object.assign({},
    state, {
      userToStats: Object.assign(state.userToStats || {}, {
        [data.author.id]: Object.assign(
          _.get(state.userToStats, data.author.id, {}), {
            [repo.id]: {
              total: data.total,
              weeks: _.filter(data.weeks, w => w && (w.a || w.d || w.c)),
            }
          }),
      }),
    }), state);

function listFollowers(options, cb) {
  if (typeof options === 'function') {
      cb = options;
      options = {};
  }
  options = this._getOptionsWithDefaults(options);
  return this._requestAllPages(this.__getScopedUrl('followers'), options, cb);
}

const getUserMetrics = (() => {
  const github = new GitHub({
    token: '6bd75ae2ebac67d37f383c67e15273580b5c1301',
  });

  return u => {
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
})();

const addUsers = (state, users = []) => Object.assign(state, {
  users: users.reduce((acc, user) => 
    _.set(acc, user.id, user), Object.assign({}, state.users)),
});

const setUserMetrics = (state, user, metrics, value) => 
  _.set(state, `${metrics}.${user.id}`, value);

let state = {};

const ps = pubsub({
  projectId: 'my-bio-163107',
  keyFilename: './my-bio-79ad36717235.json',
});

const ds = datastore({
  projectId: 'my-bio-163107',
  keyFilename: './my-bio-79ad36717235.json',
});
const key = ds.key(['State', 'default']);

// const prepareMetricsTopic = 'prepare-metrics';
const prepareStatsTopic = 'prepare-stats';

const delay = (d) => new Promise(y => setTimeout(y, d));

const tran = (key, F) => {
  const t = ds.transaction();

  return t.run()
    .then(() => t.get(key))
    .then(([entity]) => {
      entity = entity || {};
      F(entity)
      console.log('entity', entity)
      t.save(entity);
      return t.commit()
    })
    .catch(error => {
      console.log('rollback')
      return t.rollback()
        .then(() => Promise.reject(error));
    });
}

const isLocked = id => 
  ds.get(ds.key(['lock', id]))
    .then(([lock]) => lock ? lock.lock : lock);

const lock = id => 
  isLocked(id)
    .then(locked => locked ? Promise.reject() : Promise.resolve())
    .then(() => tran(ds.key(['lock', id]), e => e.lock = Date.now()));

const unlock = id =>
  ds.save({ key: ds.key(['lock', id]), data: { lock: false }});

const toMessage = event =>
  JSON.parse(Buffer.from(event.data.data, 'base64').toString());

const publish = (topic, message) => ps.topic(topic).publish(message);

const userKey = id => ds.key(['User', id]);

const updateUserTopic = 'updateUser';

exports.updateUser = event => {
  const message = toMessage(event);
  const { user, repoId, contribution, } = message;
  
  console.log(`updateUser: process ${user.login}`);

  const key = userKey(user.id);

  return Promise.resolve()
    .then(() => {
      console.log(`updateUser: get metrics for ${user.login}`);
      return Promise.all([
        getUserMetrics(data.author), 
        delay(60 * 1000)
      ]); 
    })
    .then(([metrics]) => {
      console.log(`updateUser: trying to save ${user.login}`);
      return backoff(() => 
        tran(key, user => Object.assign(user, {
          [repoId]: contribution,
        }, metrics)));
    });

  // batchPromises(_.map(stat.data, data => 
  //       () => getUserMetrics(data.author)
  //         .then(metrics => Object.assign({}, data.author, metrics))
  //         .then(author => ds.save({
  //           key: ds.key(['User', author.id]),
  //           data: author, 
  //         }))
  //       ), 10)
};

exports.processRepo = event => {
  const message = toMessage(event);
  const { repoData } = message;

  console.log(`processRepo: process ${repoData.full_name}`);
  const repo = github.getRepo(...repoData.full_name.split('/'));

  return backoff(() => 
    repo.getContributorStats()
      .then(resp => (resp.status === 200) ? resp : Promise.reject(resp)))
    .then(stat => {
      console.log(`processRepo: stage(1): get stats for ${repoData.full_name} (${stat})`);
      let promiseRepoStat = ds.save({
        key: ds.key(['Repo', repoData.id]),
        data: stat.data.reduce(
          (acc, curr) => _.set(acc, `users.${curr.author.id}`, {
            total: curr.total,
            weeks: _.filter(curr.weeks, w => w && (w.a || w.d || w.c)),
          }), repoData),
      });
      return Promise.all([promiseRepoStat, stat]);
    })
    .then(([temp, stat]) => {
      console.log(`processRepo: stage(2): create ${stat.data.length} users`);

      const userCreators = batchPromises(_.map(stat.data, data => 
        () => ds.save({
          key: userKey(data.author.id),
          data: data.author, 
        })), 10);

      return Promise.all([userCreators, stat]);
    })
    .then((result) => delay(30 * 1000).then(() => result))
    .then(([temp, stat]) => {
      console.log(`processRepo: stage(3): queue stats for ${repoData.full_name} (${stat})`);
      const promiseCreators = stat.data.map(data => ({
        user: data.author,
        repoId: repoData.id,
        contribution: {
          total: data.total,
            weeks: _.filter(data.weeks, w => w && (w.a || w.d || w.c)),
        }
      }))
      .map(message => () => publish(updateUserTopic, message));
      console.log(`processRepo: stage(3): publish ${promiseCreators.length} messages`);
      return batchPromises(promiseCreators, 10);
    });
};

exports.prepareStats = event => {
  const message = toMessage(event);
  
  console.log(`prepareStats`, message);

  if (message.type === 'repo') {
    const { repoData } = message;
    console.log(`prepareStats: process ${repoData.full_name}`);
    const repo = github.getRepo(...repoData.full_name.split('/'));

    return backoff(() => 
      repo.getContributorStats()
        .then(resp => (resp.status === 202) ? Promise.reject(resp) : resp))
      .then(stat => {
        console.log('prepareStats: stat:', stat)
        if (stat.status !== 204) {
          console.log(`prepareStats: get stats for ${repoData.full_name}`);
          let promiseRepoStat = ds.save({
            key: ds.key(['RepoStat', repoData.id]),
            data: stat.data.reduce(
              (acc, curr) => _.set(acc, curr.author.id, {
                total: curr.total,
                weeks: _.filter(curr.weeks, w => w && (w.a || w.d || w.c)),
              }), {}),
          });

          let promiseUserStat = batchPromises(
            stat.data.map(data => () => ds.save({
              key: ds.key(['User', data.author.id, 'UserStat', repoData.id]),
              data: {
                total: data.total,
                weeks: _.filter(data.weeks, w => w && (w.a || w.d || w.c)),
              }
            })), 10);

          let promiseUsers = batchPromises(_.map(stat.data, data => 
            () => getUserMetrics(data.author)
              .then(metrics => Object.assign({}, data.author, metrics))
              .then(author => ds.save({
                key: ds.key(['User', author.id]),
                data: author, 
              }))
            ), 10);

          return Promise.all([promiseRepoStat, promiseUserStat, promiseUsers]);
        }
      });
  } else if (message.type === 'start') {
    return Promise.resolve()
      .then(() => org.getRepos())
      .then(repos => {
        console.log(`prepareStats: get ${repos.data.length} repos`);
        return repos.data;
      })
      .then(repos => _.chain(repos/*.slice(0, 10)*/)
        .map(repoData => () => {
          const message = {
            type: 'repo',
            repoData
          };
          console.log(`prepareStats: publish process message for ${repoData.full_name}`, 
            message);
          
          return ps.topic(prepareStatsTopic)
            .publish(message);
        })
        .thru(fetchers => batchPromises(fetchers, 5))
        .value());
  }
}

exports.getState = (req, res) => {
  return ds.get(key)
    .then(([state]) => {
      state = state || { updatedAt: 0 };
      res.set('Content-Type', 'application/json');
      res.status(200).send(state);

      return isLocked(2);
    })
    .then(lock => {
      const lastModified = lock ? lock : 0;
      console.log(`getState: time elapsed: ${(Date.now() - lastModified) / 1000}sec`);
      if ((Date.now() - lastModified) > throttleDelay) {
        return Promise.all([
          Promise.resolve()
            .then(() => console.log(`getState: publish a message to ${prepareStatsTopic}`))
            .then(() => ps.topic(prepareStatsTopic)
              .publish({ type: 'start' })),
        ]);
      }
    })
    .catch(error => {
      console.log(`getState: error: ${error}`);
      res.status(500).send(error);
      return Promise.reject(error);
    });
};

// const update = (x) => {
//   return lock(1)
//     .then(() => console.log('after lock ', x))
//     .then(() => 
//       ds.save({ key: k, data: { w: x }})
//         .then(() => delay(3000))
//         .then(() => unlock(1))
//         .catch(() => unlock(1))
//     );
// };

// let k = ds.key(['transtest', 1]);

// const cluster = require('cluster');

// if (cluster.isMaster) {
//   cluster.fork();
//   console.log('master');
//   update('master')
//     .then(() => console.log('ok'))
//     .catch(err => console.log(err));
// } else {
//   console.log('child');
//   update('child')
//     .then(() => console.log('child ok'))
//     .catch(err => console.log(err));
// }


