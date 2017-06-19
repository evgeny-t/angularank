import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';

import SvgIcon from 'material-ui/SvgIcon';
import Paper from 'material-ui/Paper';

import { Loading } from '../Loading';
import { User, userToProps } from '../User';
import './RepoDetailsPage.css';

const StarIcon = props => (
  <SvgIcon role="img" viewBox="0 0 14 16"
    {...props}
  >
    <path fillRule="evenodd" d="M14 6l-4.9-.64L7 1 4.9 5.36 0 6l3.6 3.26L2.67 14 7 11.67 11.33 14l-.93-4.74z"></path>
  </SvgIcon>
);

const EyeIcon = props => (
  <SvgIcon role="img" viewBox="0 0 16 16"
    {...props}
  >
    <path fillRule="evenodd" d="M8.06 2C3 2 0 8 0 8s3 6 8.06 6C13 14 16 8 16 8s-3-6-7.94-6zM8 12c-2.2 0-4-1.78-4-4 0-2.2 1.8-4 4-4 2.22 0 4 1.8 4 4 0 2.22-1.78 4-4 4zm2-4c0 1.11-.89 2-2 2-1.11 0-2-.89-2-2 0-1.11.89-2 2-2 1.11 0 2 .89 2 2z"></path>
  </SvgIcon>
);

const ForkIcon = props => (
  <SvgIcon role="img" viewBox="0 0 10 16"
    {...props}
  >
    <path fillRule="evenodd" d="M8 1a1.993 1.993 0 0 0-1 3.72V6L5 8 3 6V4.72A1.993 1.993 0 0 0 2 1a1.993 1.993 0 0 0-1 3.72V6.5l3 3v1.78A1.993 1.993 0 0 0 5 15a1.993 1.993 0 0 0 1-3.72V9.5l3-3V4.72A1.993 1.993 0 0 0 8 1zM2 4.2C1.34 4.2.8 3.65.8 3c0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2zm3 10c-.66 0-1.2-.55-1.2-1.2 0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2zm3-10c-.66 0-1.2-.55-1.2-1.2 0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2z"></path>
  </SvgIcon>
);

const IssueIcon = props => (
  <SvgIcon role="img" viewBox="0 0 14 16"
    {...props}
  >
    <path fillRule="evenodd" d="M7 2.3c3.14 0 5.7 2.56 5.7 5.7s-2.56 5.7-5.7 5.7A5.71 5.71 0 0 1 1.3 8c0-3.14 2.56-5.7 5.7-5.7zM7 1C3.14 1 0 4.14 0 8s3.14 7 7 7 7-3.14 7-7-3.14-7-7-7zm1 3H6v5h2V4zm0 6H6v2h2v-2z"></path>
  </SvgIcon>
);

const iconStyle = {
  height: 17,
  width: 17,
  verticalAlign: 'text-top',
};

const RepoDetails = ({ repo, users }) => (
  <Paper
    zDepth={0}
    style={{
      marginLeft: '10%',
      marginRight: '10%',
    }}
    className='RepoDetails'
  >
    <Paper
      zDepth={1}
      style={{padding:8, margin:8,}}
      className='RepoDetails__Info'
    >
      <h2>{repo.name}</h2>
      <span><ForkIcon style={iconStyle} /> Forks {repo.forks_count}</span>
      <span><IssueIcon style={iconStyle} /> Issues {repo.open_issues_count}</span>
      <span><StarIcon style={iconStyle} /> Stargazers {repo.stargazers_count}</span>
      <span><EyeIcon style={iconStyle} /> Watchers {repo.watchers_count}</span>
    </Paper>
    
    
    {users.map(user => (
      <User user={user} 
        key={user.id}
        style={{
          width: 150,
          height: 110,
          margin: 10,
        }}
      />
    ))}
  </Paper>
);

export const RepoDetailsPage = connect(
  state => state
)(
  ({ match, repos, users, repoToStats, reposLoading }) => (
    <div>
      { reposLoading ? <Loading /> : (
        <RepoDetails 
          repo={repos[match.params.repoid]} 
          users={_.chain(repoToStats[match.params.repoid])
              .map((value, userid) => userToProps(users[userid]))
              .sortBy(user => -user.stat.total)
              .value()}
        />)}
    </div>
  )
);
