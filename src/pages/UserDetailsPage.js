import _ from 'lodash';
import React, { Component } from 'react';
import { connect } from 'react-redux';

import Avatar from 'material-ui/Avatar';
import Paper from 'material-ui/Paper';

const UserDetails = ({ user }) => (
  <Paper zDepth={1}>
    <Avatar
      src={user.avatar_url}
      size={300}
    />
    <div>{user.login}</div>
  </Paper>
);

export const UserDetailsPage = connect(
  state => state,
)(({ match, users }) => (
  <div>
    <UserDetails user={users[match.params.userid]} />
  </div>
));

