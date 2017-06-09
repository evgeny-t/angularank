import _ from 'lodash';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import AppBar from 'material-ui/AppBar';

import './App.css';

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
    <a href={user.html_url} target="_blank">
      {user.login}
    </a>
    <div>{user.stat.total}</div>
  </div>
);

class App extends Component {
  render() {
    return (
      <div className="App">
      <AppBar 
        title="Angularank"
      />
        {
          this.props.users && this.props.users.map(user => 
            <User key={user.id} user={user} />)
        }
      </div>
    );
  }
}

export default connect(
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
)(App);
