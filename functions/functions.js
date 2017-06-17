const _ = require('lodash');
const datastore = require('@google-cloud/datastore');
const pubsub = require('@google-cloud/pubsub');
const GitHub = require('github-api');

// run the whole process as often as once per 6 hours
const throttleDelay = 6 * 60 * 60 * 1000;

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

const prepareStatsTopic = 'prepareStats';
const processRepoTopic = 'processRepo';
const updateUserTopic = 'updateUser';

exports.updateUser = event => {
  const message = toMessage(event);
  const { user, repoId, contribution, } = message;
  
  console.log(`updateUser: process ${user.login}`);

  const key = userKey(user.id);

  return Promise.resolve()
    .then(() => delay(30 * 1000))
    .then(() => {
      console.log(`updateUser: get metrics for ${user.login}`);
      return getUserMetrics(user)
    })
    .then((metrics) => {
      console.log(`updateUser: trying to save ${user.login}`);
      return backoff(() => 
        tran(key, user => _.merge(user, {
          repos: {
            [repoId]: contribution,
          },
        }, metrics)));
    });
};

exports.processRepo = event => {
  const message = toMessage(event);
  const { repoData } = message;

  console.log(`processRepo: process ${repoData.full_name}`);
  const repo = github.getRepo(...repoData.full_name.split('/'));

  return Promise.resolve()
    .then(() => delay(30 * 1000))
    .then(() => backoff(() => 
      repo.getContributorStats()
        .then(resp => (resp.status === 200) ? resp : Promise.reject(resp))))
    .then(stat => {
      console.log(`processRepo: stage(1): got stats for ${repoData.full_name}`, stat);
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
      
      console.log(`processRepo: stage(1): trying to save`, data);
      let promiseRepoStat = ds.save({
        key: ds.key(['Repo', repoData.id]),
        data,
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
    })
    .catch(error => {
      console.log(`processRepo: error:`, error);
      return Promise.reject(error);
    });
};

exports.prepareStats = event => {
  const message = toMessage(event);
  
  console.log(`prepareStats`, message);

  if (message.type === 'start') {
    return Promise.resolve()
      .then(() => org.getRepos())
      .then(repos => {
        console.log(`prepareStats: get ${repos.data.length} repos`);
        return repos.data;
      })
      .then(repos => _.chain(repos/*.slice(0, 1)*/)
        .map(repoData => () => {
          const { id, name, full_name, } = repoData;
          const message = {
            type: 'repo',
            repoData: {
              id, name, full_name,
            }
          };
          console.log(
            `prepareStats: publish process message for ${repoData.full_name}`, 
            message);
          
          return publish(processRepoTopic, message);
        })
        .thru(fetchers => batchPromises(fetchers, 5))
        .value());
  }
}

exports.getState = (req, res) => {
  const timestampKey = ds.key(['Timestamp', 'default']);

  return ds.get(key)
    .then(([state]) => {
      state = state || { updatedAt: 0 };
      res.set('Content-Type', 'application/json');
      res.status(200).send(state);

      return ds.get(timestampKey);
    })
    .then(([stamp]) => {
      const lastModified = stamp ? stamp.value : 0;
      console.log(`getState: time elapsed: ${(Date.now() - lastModified) / 1000}sec`);
      if ((Date.now() - lastModified) > throttleDelay) {
        return Promise.all([
          Promise.resolve()
            .then(() => console.log(`getState: publish a message to ${prepareStatsTopic}`))
            .then(() => ps.topic(prepareStatsTopic)
              .publish({ type: 'start' })),
        ])
        .then(() => ds.save({ 
          key: timestampKey, 
          data: { value: Date.now() }
        }));
      }
    })
    .catch(error => {
      console.log(`getState: error: ${error}`);
      res.status(500).send(error);
      return Promise.reject(error);
    });
};
