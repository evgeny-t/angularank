const _ = require('lodash');
const { 
  github, backoff, wait, batchPromises, 
} = require('./utils');

// get org's repo
// publish repo processing messages

module.exports = require('./base')
  ('org', (message, { datastore: ds, pubsub: ps, }, orgName, processRepoTopic) => {
  
  let org = github.getOrganization(orgName);

  return Promise.resolve()
    .then(() => org.getRepos())
    .then(repos => {
      console.log(`org: get ${repos.data.length} repos`);
      return repos.data;
    })
    .then(repos => _.chain(repos.slice(0, 1))
      .map(repoData => () => {
        const { id, name, full_name, } = repoData;
        const message = {
          type: 'repo',
          repoData: {
            id, name, full_name,
          }
        };
        console.log(
          `org: publish process message for ${repoData.full_name}`, 
          message);
        
        return ps.topic(processRepoTopic).publish(message);
      })
      .thru(fetchers => batchPromises(fetchers, 5))
      .value());
});
