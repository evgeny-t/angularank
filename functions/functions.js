const _ = require('lodash');
const datastore = require('@google-cloud/datastore');
const GitHub = require('github-api');

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

let state = {};

const ds = datastore({
  projectId: 'my-bio-163107',
  keyFilename: './my-bio-79ad36717235.json',
});
const key = ds.key(['State', 'default']);

exports.prepareStats = event => {
  return Promise.resolve()
      .then(() => org.getRepos())
      .then(repos => {
        // console.log('repos', repos);
        return repos.data;
      })
      .then(repos => _.chain(repos.slice(0, 5))
        .map(repoData => () => {
          console.log('repoData', repoData)
          const repo = github.getRepo(...repoData.full_name.split('/'));
          return backoff(() => 
            repo.getContributorStats()
              .then(resp => (resp.status === 202) ? Promise.reject() : resp))
            .then(stat => {
              if (stat.status !== 204) {
                console.log('stat.data', repoData.full_name, repoData.id, stat.data);
                state = updateRepoStat(state, repoData, stat.data);
                state = updateUserStat(state, repoData, stat.data);
                state = addUsers(state, _.map(stat.data, 'author'));
              }
            });
          })
          .thru(fetchers => batchPromises(fetchers, 5))
          .value())
        .then(() => {
          ds.save({
            key,
            data: state,
          }, err => {
            if (err) {
              console.log(err);
            }
            console.log('ok');
          });
        });
}

exports.getState = (req, res) => {
  return ds.get(key)
    .then(([state]) => {
      res.set('Content-Type', 'application/json');
      res.status(200).send(state);
    })
    .catch(error => {
      res.status(500).send(error);
      return Promise.reject(error);
    });
};

