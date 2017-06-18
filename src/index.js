import Promise from 'promise-polyfill';
import 'whatwg-fetch'

import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';

import App from './App';
import registerServiceWorker from './registerServiceWorker';
import './index.css';

import { BrowserRouter } from 'react-router-dom';

import { Provider } from 'react-redux';
import { createLogger } from 'redux-logger';
import thunkMiddleware from 'redux-thunk';
import { createStore, applyMiddleware } from 'redux';
// import { composeWithDevTools } from 'redux-devtools-extension';

import injectTapEventPlugin from 'react-tap-event-plugin';

// import { combine, createDux } from './createDux';

import all from './dux';
import state from './state.json';
import state2 from './state2.json';

if (!window.Promise) {
  window.Promise = Promise;
}

// Needed for onTouchTap
// http://stackoverflow.com/a/34015469/988941
injectTapEventPlugin();

const {
  // updateRepoStat,
  // updateUserStat,
  // setUsers,
  addUsers,
  setRepos,
  // setUserMetrics,
  set,
} = all;

const loggerMiddleware = createLogger();

// console.log(state);
// let x = _.chain(state.users)
//   .map((user, id) => ({
//     login: user.login,
//     total: _.chain(state.userToStats[id])
//       .map('total')
//       .sum()
//       .value()
//   }))
//   .sortBy(x => -x.total)
//   .slice(0, 10)
//   .value();
// console.log(x);


const store = createStore(
  all.reducer, 
  state2,
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


const gcfEndpoint = 'https://us-central1-my-bio-163107.cloudfunctions.net';
const getUsers = (cursor = '') => 
  fetch(`${gcfEndpoint}/query?kind=User&cursor=${cursor}`)
    .then(resp => resp.json())
    .then(([data, meta]) => {
      if (meta.moreResults === 'MORE_RESULTS_AFTER_LIMIT') {
        return getUsers(meta.endCursor)
          .then(nextData => data.concat(nextData))
      } else {
        return data;
      }
    });

// TODO(ET): dispatch request begin
// TODO(ET): process the list
// TODO(ET): dispatch request end
const listUsers = (dispatch, getState) =>
  Promise.resolve()
    .then(() => dispatch(set('usersLoading', true)))
    .then(() => getUsers())
    .then(users => {
      console.log('users', users);
      return dispatch(addUsers(users))
    })
    .then(() => dispatch(set('usersLoading', false)))
    .catch(error => {
      dispatch(set('usersLoading', false));
      throw error;
    });

// store.dispatch(listUsers);
