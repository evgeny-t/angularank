import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import registerServiceWorker from './registerServiceWorker';
import './index.css';

import GitHub from 'github-api';

ReactDOM.render(<App />, document.getElementById('root'));
// registerServiceWorker();


let g = new GitHub({
  username: 'evgeny-t',
  token: '5562e457193223961f1296e7effd0a7ba0c6a384',
})
let a = g.getOrganization('angular')

g.getRateLimit().getRateLimit()
  .then(rl => {
    console.log(rl)
  })

a.getRepos().then(repos => {
  console.log(repos)
  let r = repos.data[2];
  console.log(r.name, r)
  r = g.getRepo(...r.full_name.split('/'))
  r.getContributors()
    .then(ctrbs => {
      console.log('ctrbs:', ctrbs)
    })
  r.getContributorStats()
    .then(stats => {
      console.log('stats:', stats)
    })
  // r.getContributors().then(c => {
  //   console.log(c);
  // })
})
console.log()
