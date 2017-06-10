import _ from 'lodash';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Route, Link } from 'react-router-dom';
import AppBar from 'material-ui/AppBar';
import Avatar from 'material-ui/Avatar';
import Paper from 'material-ui/Paper';

import {
  Toolbar, ToolbarGroup, 
  ToolbarSeparator, ToolbarTitle
} from 'material-ui/Toolbar';
import RaisedButton from 'material-ui/RaisedButton';
import Popover from 'material-ui/Popover';
import Menu from 'material-ui/Menu';
import MenuItem from 'material-ui/MenuItem';

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

class RankFilter extends Component {
  state = {
    open: false,
    filters: [
      'By Contribution',
      'By Followers',
      'By Public repos & gists',
    ],
    current: 0,
  }

  handleClick = event => {
    event.preventDefault();
    this.setState({
      open: true,
      anchorEl: event.currentTarget,
    });
  }

  handleRequestClose = event => {
    this.setState({ open: false });
  }

  render() {
    return <div>
      <RaisedButton 
        onTouchTap={this.handleClick}
        label={this.state.filters[this.state.current]}
      />
      <Popover
        open={this.state.open}
        onRequestClose={this.handleRequestClose}
        anchorEl={this.state.anchorEl}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
        targetOrigin={{ horizontal: 'left', vertical: 'top' }}
      >
        <Menu>
          {
            this.state.filters.map((filter, index) => 
              <MenuItem 
                key={filter}
                primaryText={filter} 
                onTouchTap={() => 
                  this.setState({ 
                    current: index,
                    open: false,
                  })}
              />)
          }
        </Menu>
      </Popover>
    </div>;
  }
}

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
    <Toolbar>
      <ToolbarGroup>
        <RankFilter />
      </ToolbarGroup>
    </Toolbar>
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

