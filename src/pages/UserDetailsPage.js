import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';

import { Link } from 'react-router-dom';

import Avatar from 'material-ui/Avatar';
import Paper from 'material-ui/Paper';
import SvgIcon from 'material-ui/SvgIcon';

import { Loading } from '../Loading';
import './UserDetailsPage.css';

const abbreviate = i => 
  i >= 1000 ? `${(i / 1000).toFixed(1)}k` : String(i);
  
const StarIcon = props => (
  <SvgIcon role="img" viewBox="0 0 14 16"
    {...props}
  >
    <path fillRule="evenodd" 
      d={`M14 6l-4.9-.64L7 1 4.9 5.36 0 6l3.6 3.26L2.67 14 7 11.67 11.33 
      14l-.93-4.74z`}></path>
  </SvgIcon>
);

const ForkIcon = props => (
  <SvgIcon role="img" viewBox="0 0 10 16"
    {...props}
  >
    <path fillRule="evenodd" d={`M8 1a1.993 1.993 0 0 0-1 3.72V6L5 8 3 
  6V4.72A1.993 1.993 0 0 0 2 1a1.993 1.993 0 0 0-1 3.72V6.5l3 
  3v1.78A1.993 1.993 0 0 0 5 15a1.993 1.993 0 0 0 1-3.72V9.5l3-3V4.72A1.993 
  1.993 0 0 0 8 1zM2 4.2C1.34 4.2.8 3.65.8 3c0-.65.55-1.2 1.2-1.2.65 0 
  1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2zm3 10c-.66 0-1.2-.55-1.2-1.2 0-.65.55-1.2 
  1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2zm3-10c-.66 0-1.2-.55-1.2-1.2 
  0-.65.55-1.2 1.2-1.2.65 0 1.2.55 1.2 1.2 0 .65-.55 1.2-1.2 1.2z`}></path>
  </SvgIcon>
);

const iconStyle = {
  width: 15,
  height: 15,
  verticalAlign: 'middle',
};

const Repo = ({ id, name, language, 
  forks_count, stargazers_count }) => (
  <Paper 
    className='Repo'
    zDepth={1}
    style={{
      
    }}
  >
    <div>
      <Link to={`/repos/${id}`}>{name}</Link>
    </div>
    <div className='Repo__Info'>
      <span className={`Repo__Language Repo__Language--${language}`}>
        {language}
      </span>
      {stargazers_count && <StarIcon style={iconStyle} />}
      {stargazers_count && <span>{abbreviate(stargazers_count)}</span>}
      {forks_count && <ForkIcon style={iconStyle} />}
      {forks_count && <span>{abbreviate(forks_count)}</span>}
    </div>
  </Paper>
);

const UserDetails = ({ user, repos }) => (
  <Paper zDepth={1}
    style={{
      position: 'relative',
      width: '75%',
      height: '100%',
      margin: '0 auto',
    }}>
    <div style={{
      position: 'absolute',
      width: 245,
      textAlign: 'center',
    }}>
      <Avatar
        src={user.avatar_url}
        size={200}
      />
      <div style={{
        paddingTop: 10,
      }}>
        {user.login}
      </div>
    </div>
    <div style={{
      position: 'absolute',
      right: 0,
      width: 'calc(100% - 245px)',
    }}>
      {_.map(repos, repo => 
        <Repo key={repo.id} {...repo} />)}
    </div>
    {/* TODO(ET): big nice calendar with contribution stats */}
  </Paper>
);

export const UserDetailsPage = connect(
  state => state,
)(({ match, users, repos, usersLoading, }) => (
  <div style={{
    width: '100%',
    padding: 20,
  }}>
    { usersLoading ? <Loading /> : (
      <UserDetails 
        user={users[match.params.userid]} 
        repos={_.map(users[match.params.userid].repos, 
          (repo, id) => repos[id])}
      />)
    }
  </div>
));

