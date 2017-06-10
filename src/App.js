import _ from 'lodash';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Route, Link } from 'react-router-dom';
import AppBar from 'material-ui/AppBar';
import Avatar from 'material-ui/Avatar';
import Paper from 'material-ui/Paper';

import './App.css';

const UserDetails = ({ user }) => (
  <Paper zDepth={1}>
    <Avatar
      src={user.avatar_url}
      size={300}
    />
    <div>{user.login}</div>
  </Paper>
);

const UserDetailsContainer = connect(
  state => state,
)(({ match, users }) => (
  <div>
    <UserDetails user={users[match.params.userid]} />
  </div>
));

const User = ({ user }) => (
  <div style={{
    height: 100,
    width: 100,
    display: 'inline-block',
    border: '1px solid #ee1',
  }}>
    <img width={50} height={50} 
      src={user.avatar_url} 
      style={{ 
        display: 'block',
        margin: '0 auto',
      }}
    />
    <Link to={`/users/${user.id}`}>
      {user.login}
    </Link>
    
    <div>{user.stat.total}</div>
  </div>
);

const Users = connect(
  state => ({ 
    users: _.chain(state.users)
      .map(user => ({
        ...user,
        stat: _.chain(state.userToStats[user.id])
          .reduce((acc, repoStats, repoId) => ({ 
            total: acc.total + repoStats.total 
          }), { total: 0 })
          .value(),
      }))
      .sortBy(user => -user.stat.total)
      .value()
      // .slice(0, 30),
  }),
  dispatch => ({}),
)(({ users }) => {
  return <div>
    {users ? users.map(user => <User key={user.id} user={user} />) : null}
  </div>
});

export default class App extends Component {
  render() {
    return (
      <div className="App">
      <AppBar 
        title={<Link style={{ 
          textDecoration: 'none',
          color: 'white',
        }} to='/'>Angularank</Link>}
      />
        <Route exact path='/' component={Users} />
        <Route path={`/users/:userid`} component={UserDetailsContainer} />
      </div>
    );
  }
}
