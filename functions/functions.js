const _ = require('lodash');
const datastore = require('@google-cloud/datastore');
const pubsub = require('@google-cloud/pubsub');
const GitHub = require('github-api');

const throttleDelay = 60 * 1000;

const github = new GitHub({
   token: '5562e457193223961f1296e7effd0a7ba0c6a384',
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
    .catch(() => wait(delay)
      .then(() => backoff(promiseCreator, delay * 2)));

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

const prepareMetricsTopic = 'prepare-metrics';
const prepareStatsTopic = 'prepare-stats';

exports.prepareStats = event => {
  return Promise.resolve()
      .then(() => org.getRepos())
      .then(repos => {
        // console.log('repos', repos);
        console.log(`prepareStats: get ${repos.data.length} repos`);
        return repos.data;
      })
      .then(repos => _.chain(repos.slice(0, 5))
        .map(repoData => () => {
          console.log(`prepareStats: process ${repoData.full_name}`);
          const repo = github.getRepo(...repoData.full_name.split('/'));
          return backoff(() => 
            repo.getContributorStats()
              .then(resp => (resp.status === 202) ? Promise.reject() : resp))
            .then(stat => {
              if (stat.status !== 204) {
                console.log(`prepareStats: get stats for ${repoData.full_name}`);
                state = updateRepoStat(state, repoData, stat.data);
                state = updateUserStat(state, repoData, stat.data);
                state = addUsers(state, _.map(stat.data, 'author'));
              }
            });
          })
          .thru(fetchers => batchPromises(fetchers, 5))
          .value())
        .then(() => {
          console.log(`prepareStats: save state`);
          return ds.save({
            key,
            data: Object.assign(state, { 
              updatedAt: Date.now() 
            }),
          });
        })
        .then(() => console.log(`getState: publish a message to ${prepareMetricsTopic}`))
        .then(() => ps.topic(prepareMetricsTopic).publish(''));
}

exports.getState = (req, res) => {
  return ds.get(key)
    .then(([state]) => {
      res.set('Content-Type', 'application/json');
      res.status(200).send(state);

      console.log(`getState: time elapsed: ${(Date.now() - state.updatedAt) / 1000}sec`);
      if ((Date.now() - state.updatedAt) > throttleDelay) {
        return Promise.all([
          Promise.resolve()
            .then(() => console.log(`getState: publish a message to ${prepareStatsTopic}`))
            .then(() => ps.topic(prepareStatsTopic).publish('')),
          // Promise.resolve()
          //   .then(() => console.log(`getState: publish a message to ${prepareMetricsTopic}`))
          //   .then(() => ps.topic(prepareMetricsTopic).publish(''))
        ]);
      }
    })
    .catch(error => {
      console.log(`getState: error: ${error}`);
      res.status(500).send(error);
      return Promise.reject(error);
    });
};

function listFollowers(options, cb) {
  if (typeof options === 'function') {
      cb = options;
      options = {};
  }
  options = this._getOptionsWithDefaults(options);
  return this._requestAllPages(this.__getScopedUrl('followers'), options, cb);
}

exports.prepareMetrics = event => {
  const github = new GitHub({
    token: 'a2a3ef298d28910a171525f58589680ef153f598',
  });

  const setUserMetrics = (state, user, metrics, value) => 
    _.set(state, `${metrics}.${user.id}`, value);

  let state = {};
  return Promise.resolve()
    .then(() => ds.get(key))
    .then(([state]) => 
      _.chain(state.users)
        .map()
        .map(u => () => {
          let user = github.getUser(u.login);
          console.log(`prepareMetrics: process ${u.login}`);

          const requests = [
            backoff(() => user.listRepos({})), 
            backoff(() => user.listGists()),
            backoff(() => listFollowers.call(user, {})),
          ];
          return Promise.all(requests)
            .then(([repos, gists, followers]) => {
              const total = repos.data.length + gists.data.length;
              console.log(`prepareMetrics: save ${u.login}`);
              return ds.save({
                key: ds.key(['Metrics', user.id]),
                data: {
                  userToRepos: total,
                  userToFollowers: followers.data.length,
                }
              })
            });
        })
        .thru(fetchers => batchPromises(fetchers, 1))
        .value())
    .then(() => {
      console.log(`prepareMetrics: done`);
    })
};



// let k = ds.key(['Test', 1]);

// const update = updater => {
//   const transaction = ds.transaction();
//   return new Promise((y, n) => {
//     transaction.run(err => {
//       if (err) {
//         console.log('transaction.run', err);
//       }

//       transaction.get(key)
//         .then(entity => {
//           updater(entity);
//           transaction.save(entity);
//         })
//         .then(() => transaction.commit())
//         .then(() => console.log('commited'))
//         .then(y)
//         .catch(n);
//     });
//   });
  
// }


// Promise.all([
//   update(e => e.foo = 42),
//   update(e => e.baz = '1337')
//   // ds.save({ key: k, data: { foo: 42 } }),
//   // ds.save({ key: k, data: { baz: '1337' } }),
// ]).then(() => console.log('ok'))
// .then(() => ds.get(k))
// .then(([e]) => console.log(e))
// .catch(err => console.log(err));

