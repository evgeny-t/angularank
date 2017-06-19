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

import injectTapEventPlugin from 'react-tap-event-plugin';

import all from './dux';
// import state from './state.json';
// import state2 from './state2.json';

if (!window.Promise) {
  window.Promise = Promise;
}

// Needed for onTouchTap
// http://stackoverflow.com/a/34015469/988941
injectTapEventPlugin();

const {
  addUsers,
  setRepos,
  set,
} = all;

const loggerMiddleware = createLogger();

const store = createStore(
  all.reducer, {
    // ...state2,
    usersLoading: true,
    reposLoading: true,
    rankFilter: {
      filters: [
        'By Contribution',
        'By Followers',
        'By Public repos & gists',
      ],
      current: 0,
    }
  },
  applyMiddleware(thunkMiddleware, loggerMiddleware)
);

window.store = store;

const gcfEndpoint = 'https://us-central1-my-bio-163107.cloudfunctions.net';

const gcfGet = (kind, cursor = '') => 
  fetch(`${gcfEndpoint}/query?kind=${kind}&cursor=${cursor}`)
    .then(resp => resp.json())
    .then(([data, meta]) => {
      if (meta.moreResults === 'MORE_RESULTS_AFTER_LIMIT') {
        return gcfGet(kind, meta.endCursor)
          .then(nextData => data.concat(nextData))
      } else {
        return data;
      }
    });

const listUsers = (dispatch, getState) =>
  Promise.resolve()
    .then(() => dispatch(set('usersLoading', true)))
    .then(() => gcfGet('User'))
    .then(users => dispatch(addUsers(users)))
    .then(() => dispatch(set('usersLoading', false)))
    .catch(error => {
      dispatch(set('usersLoading', false));
      throw error;
    });

const listRepos = (dispatch, getState) =>
  Promise.resolve()
    .then(() => dispatch(set('reposLoading', true)))
    .then(() => gcfGet('Repo'))
    .then(repos => dispatch(setRepos(repos)))
    .then(() => dispatch(set('reposLoading', false)))
    .catch(error => {
      dispatch(set('reposLoading', false));
      throw error;
    });

store.dispatch(listUsers);
store.dispatch(listRepos);

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
