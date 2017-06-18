const gcloud = require('google-cloud')({
  projectId: 'my-bio-163107',
  keyFilename: './my-bio-79ad36717235.json',
});

const datastore = gcloud.datastore();
const storage = gcloud.storage();
const pubsub = gcloud.pubsub();

const cluster = require('cluster');

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

require('./workers/org')(gcloud, 'angular', 'repo');
require('./workers/repo')(gcloud, 'user');
require('./workers/user')(gcloud);
