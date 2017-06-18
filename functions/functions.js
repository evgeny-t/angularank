const _ = require('lodash');
const datastore = require('@google-cloud/datastore')({
  projectId: 'my-bio-163107',
  keyFilename: './my-bio-79ad36717235.json',
});

exports.query = (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET');

  if (req.query && req.query.kind) {
    const query = datastore.createQuery(req.query.kind)
      .limit(250);
    if (req.query && req.query.cursor) {
      query.start(req.query.cursor);
    }

    return datastore.runQuery(query)
      .then(results => {
        res.status(200).send(results);
      });
  } else {
    res.status(500).send('Missing Kind. Pass kind=<Kind>.');
  }
};
