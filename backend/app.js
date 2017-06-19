const gcloud = require('google-cloud')({
  projectId: 'my-bio-163107',
  keyFilename: './my-bio-79ad36717235.json',
});

require('./workers/org')(gcloud, 'angular', 'repo');
require('./workers/repo')(gcloud, 'user');
require('./workers/user')(gcloud);
