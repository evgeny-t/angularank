import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import registerServiceWorker from './registerServiceWorker';
import './index.css';

import GitHub from 'github-api';

import { Provider } from 'react-redux';
import { createLogger } from 'redux-logger';
import thunkMiddleware from 'redux-thunk';
import { createStore, applyMiddleware } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import _ from 'lodash';

import state from './state.cached.js';
console.log('state', state);

const loggerMiddleware = createLogger();

const combine = (...reducers) => (state, action) => {
  for (let i = 0; i < reducers.length; ++i) {
    let newState = reducers[i](state, action);
    if (newState !== undefined && newState !== state) {
      return newState;
    }
  }
  return state;
}

const createDux = options => {
  return { 
    ..._.reduce(options, (acc, val, key) => 
      _.set(acc, key, (...args) => ({ type: _.snakeCase(key).toUpperCase(), args })), {}),
    reducer: combine(
      ..._.map(options, (val, key) => 
        (state, { type, args }) => 
          type === _.snakeCase(key).toUpperCase() ? val(state, ...args) : state)),
  };
};

const { setUsers, reducer: usersReducer } = createDux({
  setUsers: (state, users) => ({ ...state, users }),
})

const store = createStore(
  usersReducer, 
  state,
  composeWithDevTools(applyMiddleware(thunkMiddleware, loggerMiddleware))
);

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>, 
  document.getElementById('root'));
// registerServiceWorker();


let g = new GitHub({
  username: 'evgeny-t',
  token: '5562e457193223961f1296e7effd0a7ba0c6a384',
})
let a = g.getOrganization('angular');

g.getRateLimit().getRateLimit()
  .then(rl => {
    console.log(rl)
  });

(function() {
a.getRepos().then(repos => {
  console.log(repos)

  const users = 
    _.chain(repos.data.slice(0, 1))
      .map(repoData => 
        () => g.getRepo(...repoData.full_name.split('/')).getContributorStats())
      .thru(requests => _.chunk(requests, 1))
      .reduce((acc, curr) => 
        acc.then(previous => Promise.all([...previous, ...curr.map(request => request())])), Promise.resolve([]))
      .value()
      .then(contribStatsResponse => 
        _.chain(contribStatsResponse)
          .map('data')
          .flatten()
          .map('author')
          .value())
      .then(users => store.dispatch(setUsers(users)));
});
  // let r = repos.data[2];
  // console.log(r.name, r)
  // r = g.getRepo(...r.full_name.split('/'))
  // r.getContributors()
  //   .then(ctrbs => {
  //     console.log('ctrbs:', ctrbs)
  //   })
  // r.getContributorStats()
  //   .then(stats => {
  //   });
  //     console.log('stats:', stats)
})();

