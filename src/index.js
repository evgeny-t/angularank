import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';

import App from './App';
import registerServiceWorker from './registerServiceWorker';
import './index.css';

import GitHub from 'github-api';

import { BrowserRouter } from 'react-router-dom';

import { Provider } from 'react-redux';
import { createLogger } from 'redux-logger';
import thunkMiddleware from 'redux-thunk';
import { createStore, applyMiddleware } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';

import injectTapEventPlugin from 'react-tap-event-plugin';

import { combine, createDux } from './createDux';

import all from './dux';
// let state = {};
import state from './state.json';

// Needed for onTouchTap
// http://stackoverflow.com/a/34015469/988941
injectTapEventPlugin();

const {
  updateRepoStat,
  updateUserStat,
  setUsers,
  addUsers,
  setRepos,
} = all;

const loggerMiddleware = createLogger();

const store = createStore(
  all.reducer, 
  state,
  /*composeWithDevTools*/(applyMiddleware(thunkMiddleware, loggerMiddleware))
);

window.store = store;

ReactDOM.render(
  <Provider store={store}>
    <MuiThemeProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </MuiThemeProvider>
  </Provider>, 
  document.getElementById('root'));
// registerServiceWorker();

const batchPromises = (promiseCreators, chunkSize) =>
  Promise.resolve(_.chunk(promiseCreators, chunkSize))
    .then(chunks => chunks.reduce((acc, curr) => 
      acc.then(previous => Promise.all([
        ...previous, ...curr.map(request => request())
      ])), Promise.resolve([])));

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

const backoff = (promiseCreator, delay = 1000) => 
  promiseCreator()
    .then(resp => {
      console.log('resp: ', resp)
      if (resp.status === 202) {
        console.log('backoff:', delay, resp);
        return wait(delay)
          .then(() => backoff(promiseCreator, delay * 2));
      } else {
        console.log(`backoff: ${resp.status} after ${delay}`);
        return resp;
      }
    });

let github = new GitHub({
  username: 'evgeny-t',
  token: '5562e457193223961f1296e7effd0a7ba0c6a384',
})
let org = github.getOrganization('angular');

const fetchRepos = () => 
  (dispatch, getState) => 
    Promise.resolve()
      .then(() => org.getRepos())
      .then(repos => dispatch(setRepos(repos.data)));

const fetchContributorsStats = (repos) => 
  (dispatch, getState) => 
    Promise.resolve()
      .then(() => _.chain(repos/*.slice(0, 5)*/)
        .map(repoData => () => {
          const repo = github.getRepo(...repoData.full_name.split('/'));
          return backoff(() => repo.getContributorStats())
            .then(stat => {
              console.log('stat', stat)
              if (stat.status !== 204) {
                console.log('stat', repoData.full_name, repoData.id, stat);
                dispatch(updateRepoStat(repoData, stat.data));
                dispatch(updateUserStat(repoData, stat.data));
                dispatch(addUsers(_.map(stat.data, 'author')));
              }
            });
        })
        .thru(fetchers => batchPromises(fetchers, 5))
        .value());

// store.dispatch(fetchRepos())
//   .then(() => {
//     console.log('fetchRepos:', store.getState());
//     store.dispatch(fetchContributorsStats(
//       // [store.getState().repos[460078]]));
//       _.map(store.getState().repos)));
//   });

function listFollowers(options, cb) {
  if (typeof options === 'function') {
      cb = options;
      options = {};
  }
  options = this._getOptionsWithDefaults(options);
  return this._requestAllPages(this.__getScopedUrl('followers'), options, cb);
}

setTimeout(() => {
  _.chain(store.getState().users)
    .map()
    .slice(0, 1)
    .map(u => {
      let user = github.getUser(u.login);
      console.log(user)
      user.listRepos({})
        .then(repos => {
          console.log(u.login, repos);
        })
        .then(() => user.listGists())
        .then(gists => {
          console.log(u.login, gists);
        })
        .then(listFollowers.bind(user, {}))
        .then(result => {
          console.log('result', result);
        })
    })
    .value();
}, 1000);

// TODO(ET): user to followers
// TODO(ET): user to public repos&gists
