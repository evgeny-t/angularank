import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';

const RepoDetails = ({ repo, users }) => (
  <div>
    <div>{repo.full_name}</div>
    <div>forks_count: {repo.forks_count}</div>
    <div>open_issues_count: {repo.open_issues_count}</div>
    <div>stargazers_count: {repo.stargazers_count}</div>
    <div>watchers_count: {repo.watchers_count}</div>
    {users.map(user => <div>{user.login}</div>)}
  </div>
);

export const RepoDetailsPage = connect(
  state => state
)(
  ({ match, repos, users, repoToStats }) => (
    <div>
      <RepoDetails 
        repo={repos[match.params.repoid]} 
        users={_.map(repoToStats[match.params.repoid], 
          (value, userid) => users[userid])}
      />
    </div>
  )
);
