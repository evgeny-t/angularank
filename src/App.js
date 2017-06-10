import _ from 'lodash';
import React, { Component } from 'react';
import { Route, Link } from 'react-router-dom';

import AppBar from 'material-ui/AppBar';

import './App.css';

import { UsersPage, UserDetailsContainer } from './pages/UsersPage';

export default class App extends Component {
  render() {
    return (
      <div className="App">
        <AppBar 
          title={<Link style={{ 
            color: 'white',
          }} to='/'>Angularank</Link>}
        />
        <Route exact path='/' component={UsersPage} />
        <Route path={`/users/:userid`} component={UserDetailsContainer} />
      </div>
    );
  }
}

