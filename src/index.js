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

import { combine, createDux } from './dux'

import state from './state.cached.js';

const loggerMiddleware = createLogger();

const { setUsers, addUsers, reducer: usersReducer } = createDux({
  setUsers: (state, users) => ({ ...state, users }),
  addUsers: (state, users) => ({ 
    ...state, 
    users: [].concat(state.users || [], users)
  }),
});

const { setRepos, reducer: reposReducer } = createDux({
  setRepos: (state, repos) => ({ 
    ...state, 
    repos: repos.reduce((acc, curr) => _.set(acc, curr.id, curr), {}),
  }),
});

const store = createStore(
  combine(usersReducer, reposReducer), 
  {/*state*/},
  composeWithDevTools(applyMiddleware(thunkMiddleware, loggerMiddleware))
);

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>, 
  document.getElementById('root'));
// registerServiceWorker();

const batchPromises = (promiseCreators, chunkSize) =>
  Promise.resolve(_.chunk(promiseCreators, chunkSize))
    .then(chunks => chunks.reduce((acc, curr) => 
      acc.then(previous => Promise.all([
        ...previous, ...curr.map(request => request())
      ])), Promise.resolve([])));

let github = new GitHub({
  username: 'evgeny-t',
  token: '5562e457193223961f1296e7effd0a7ba0c6a384',
})
let org = github.getOrganization('angular');

github.getRateLimit().getRateLimit()
  .then(rl => {
    console.log(rl)
  });

const fetchRepos = () => 
  (dispatch, getState) => 
    Promise.resolve()
      .then(() => org.getRepos())
      .then(repos => dispatch(setRepos(repos.data)));

const fetchContributorsStats = (repos) => 
  (dispatch, getState) => 
    Promise.resolve()
      .then(() => _.chain(repos.slice(0, 2))
        .map(repoData => () => {
          const repo = github.getRepo(...repoData.full_name.split('/'));
          return repo.getContributorStats()
            .then(stat => {
              console.log('stat', stat);
              dispatch(addUsers(_.map(stat.data, 'author')));
            })
        })
        .thru(fetchers => batchPromises(fetchers, 1))
        .value());

store.dispatch(fetchRepos())
  .then(() => {
    console.log('fetchRepos:', store.getState());
    store.dispatch(fetchContributorsStats(_.map(store.getState().repos)));
  });


