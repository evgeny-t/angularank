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

// if (cluster.isMaster) {
//   console.log('master')
//   cluster.fork();
//   pubsub.subscribe('test', 'client', {
//     autoAck: true,
//   }, (err, subscription, apiResponse) => {
//     if (err) {
//       console.error('error:', err);
//     }
//     console.log('subscribed', subscription.name);

//     const pullOne = () => 
//       subscription.pull({ maxResults: 1 })
//         .then(([messages, apiResponse]) => {
//           if (messages && messages.length) {
//             console.log('received:', messages[0].data);
//             return wait(5000)
//               .then(() => console.log('processed:', messages[0].data));
//           }
//         })
//         .then(pullOne);
    
//     pullOne();
//     console.log(':P');
//     // subscription.on('message', message => {
//     //   console.log('received:', message.data);
//     //   setTimeout(() => console.log('processed:', message.data), 5000);
//     // });
//   });
// } else {
//   console.log('slave')
//   const publish = message => {
//     console.log('publish', message);
//     pubsub.topic('test').publish(message);
//   };

//   wait(0)
//     .then(() => {
//       publish('qx-test11');
//       publish('qx-test12');
//       publish('qx-test13');
//     })
// }

