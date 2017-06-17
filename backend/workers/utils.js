const _ = require('lodash');
const GitHub = require('github-api');
const ghConfig = require('../../github.json');
const github = new GitHub(Object.assign({}, ghConfig));

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

const transactionCreator = ds =>
  (key, F) => {
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
  };

module.exports = {
  batchPromises,
  wait,
  backoff,
  github,
  transactionCreator,
};
