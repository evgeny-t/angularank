import _ from 'lodash';
import React, { Component } from 'react';
import { Route, Link } from 'react-router-dom';

import AppBar from 'material-ui/AppBar';

import './App.css';

import { UsersPage } from './pages/UsersPage';
import { UserDetailsPage } from './pages/UserDetailsPage'
import { RepoDetailsPage } from './pages/RepoDetailsPage';

export default class App extends Component {
  render() {
    return (
      <div className="App">
        <AppBar 
          title={<Link style={{ 
            color: 'white',
          }} to='/'>Angularank</Link>}
        />
{/*TODO(ET): layout componenet*/}
        <Route exact path='/' component={UsersPage} />
        <Route path={`/users/:userid`} component={UserDetailsPage} />
        <Route path={`/repos/:repoid`} component={RepoDetailsPage} />
      </div>
    );
  }
}

