const _ = require('lodash');
const { 
  github, backoff, wait, batchPromises, 
} = require('./utils');

const pause = 60 * 1000;

// wait
// get repo's contributors
// save repo
// save repo's contributors
// wait
// publish user updaters

module.exports = require('./base')
  ('repo', (message, { datastore: ds, pubsub: ps, }, updateUserTopic) => {

  const { repoData } = message;
  const userKey = id => ds.key(['User', id]);

  console.log(`repo: process ${repoData.full_name}`);
  const repo = github.getRepo(...repoData.full_name.split('/'));

  return Promise.resolve()
    .then(() => wait(pause))
    .then(() => backoff(() => 
      repo.getContributorStats()
        .then(resp => {
          if (resp.status === 204) 
            return { data: [] };
          return (resp.status === 200) ? resp : Promise.reject(resp);
        })))
    .then(stat => {
      console.log(`repo: stage(1): got stats for ${repoData.full_name}`);
      const data = stat.data.reduce(
        (acc, curr) => _.merge(acc, {
          users: {
            [curr.author.id]: {
              user: curr.author,
              total: curr.total,
              // weeks: _.filter(curr.weeks, w => w && (w.a || w.d || w.c)),
            },
          },
        }), Object.assign({}, repoData));
      
      console.log(`repo: stage(1): trying to save`, data);
      let promiseRepoStat = ds.save({
        key: ds.key(['Repo', repoData.id]),
        data,
      });

      return Promise.all([promiseRepoStat, stat]);
    })
    .then(([temp, stat]) => {
      console.log(`repo: stage(2): create ${stat.data.length} users`);

      const userCreators = batchPromises(_.map(stat.data, data => 
        () => ds.save({
          key: userKey(data.author.id),
          data: data.author, 
        })), 10);

      return Promise.all([userCreators, stat]);
    })
    .then((result) => wait(pause).then(() => result))
    .then(([temp, stat]) => {
      console.log(`repo: stage(3): queue stats for ${repoData.full_name} (${stat})`);
      const promiseCreators = stat.data.map(data => ({
        user: data.author,
        repoId: repoData.id,
        contribution: {
          total: data.total,
          weeks: _.filter(data.weeks, w => w && (w.a || w.d || w.c)),
        }
      }))
      .map(message => () => ps.topic(updateUserTopic).publish(message));
      console.log(`repo: stage(3): publish ${promiseCreators.length} messages`);
      return batchPromises(promiseCreators, 10);
    })
    .catch(error => {
      console.log(`repo: error:`, error);
      return Promise.reject(error);
    });
});
