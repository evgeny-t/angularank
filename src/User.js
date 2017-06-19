import _ from 'lodash';
import React from 'react';
import { Link } from 'react-router-dom';

import CodeIcon from 'material-ui/svg-icons/action/code';
import PeopleIcon from 'material-ui/svg-icons/social/people';
import SvgIcon from 'material-ui/SvgIcon';
import Avatar from 'material-ui/Avatar';
import Paper from 'material-ui/Paper';

export const userToProps = user => ({
  ...user,
  stat: _.chain(user.repos)
    .reduce((acc, repoStats, repoId) => ({ 
      ...acc,
      total: acc.total + repoStats.total 
    }), { 
      total: 0,
      repos: user.userToRepos,
      followers: user.userToFollowers,
    })
    .value(),
});

export const RepoIcon = props => (
  <SvgIcon role="img" viewBox="0 0 12 16"
    {...props}
  >
    <path fillRule="evenodd" 
      d="M4 9H3V8h1v1zm0-3H3v1h1V6zm0-2H3v1h1V4zm0-2H3v1h1V2zm8-1v12c0 .55-.45 1-1 1H6v2l-1.5-1.5L3 16v-2H1c-.55 0-1-.45-1-1V1c0-.55.45-1 1-1h10c.55 0 1 .45 1 1zm-1 10H1v2h2v-1h3v1h5v-2zm0-10H2v9h9V1z">
    </path>
  </SvgIcon>
);

export const styles = {
  user: {
    metricsContainer: {
      position: 'absolute',
      textAlign: 'left',
      margin: 4,
      right: 0,
      width: `calc(100% - ${75 + 8 + 8}px)`,
    },
    metrics: {
      display: 'block',
      marginTop: 2,
    },
    icon: {
      width: 15,
      height: 15,
      verticalAlign: 'middle',
      display: 'inline',
    },
    value: {
      verticalAlign: 'middle',
      fontSize: '0.7rem',
      margin: 2,
    }
  }
}

export const User = ({ user, style }) => (
  <Paper 
    zDepth={1}
    style={{
      ...style,
      display: 'inline-block',
    }}
  >
    <div style={{
      position: 'relative',
      height: `${75 + 8}px`,
    }}>
      <Avatar 
        src={user.avatar_url} 
        size={75}
        style={{
          display: 'block',
          margin: 4,
          position: 'absolute',
        }}
      />

      <div style={styles.user.metricsContainer}>

        <div style={styles.user.metrics}>
          <CodeIcon 
            style={styles.user.icon}
          />
          <span style={styles.user.value}>
            {user.stat.total}
          </span>
        </div>

        <div style={styles.user.metrics}>
          <PeopleIcon 
            style={styles.user.icon}
          />
          <span style={styles.user.value}>
            {user.stat.followers}
          </span>
        </div>

        <div style={styles.user.metrics}>
          <RepoIcon
            style={styles.user.icon}
          />
          <span style={styles.user.value}>
            {user.stat.repos}
          </span>
        </div>

      </div>

    </div>
    
    <Link 
      to={`/users/${user.id}`}
      style={{
        display: 'block',
        textAlign: 'center',
        overflow: 'hidden',
        maxHeight: 24,
      }}
    >
      {user.login}
    </Link>
  </Paper>
);
