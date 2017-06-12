import _ from 'lodash';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

import SvgIcon from 'material-ui/SvgIcon';
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

import CodeIcon from 'material-ui/svg-icons/action/code';
import PeopleIcon from 'material-ui/svg-icons/social/people';

import Measure from 'react-measure';

import { Collection, WindowScroller } from 'react-virtualized';
import 'react-virtualized/styles.css';

// stolen from GitHub
const RepoIcon = props => (
  <SvgIcon role="img" viewBox="0 0 12 16"
    {...props}
  >
    <path fillRule="evenodd" 
      d="M4 9H3V8h1v1zm0-3H3v1h1V6zm0-2H3v1h1V4zm0-2H3v1h1V2zm8-1v12c0 .55-.45 1-1 1H6v2l-1.5-1.5L3 16v-2H1c-.55 0-1-.45-1-1V1c0-.55.45-1 1-1h10c.55 0 1 .45 1 1zm-1 10H1v2h2v-1h3v1h5v-2zm0-10H2v9h9V1z">
    </path>
  </SvgIcon>
);

const styles = {
  user: {
    metricsContainer: {
      position: 'absolute',
      textAlign: 'left',
      left: `${75 + 4 + 4}px`,
      margin: 4,
    },
    metrics: {
      // border: '1px solid #2ee',
      display: 'block',
      marginTop: 2,
    },
    icon: {
      width: 15,
      height: 15,
      verticalAlign: 'middle',
      // border: '1px solid #ee2',
      display: 'inline',
    },
    value: {
      verticalAlign: 'middle',
      // border: '1px solid #e2e',
      fontSize: '0.7rem',
      margin: 2,
    }
  }
}

const User = ({ user, style }) => (
  <Paper 
    zDepth={1}
    style={{
      ...style,
      display: 'inline-block',
      // border: '1px solid #ee1',
    }}
  >
    <div style={{
      position: 'relative',
      height: 'calc(50% + 8px)',
      border: '1px solid red',
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
    
    <Link to={`/users/${user.id}`}>
      {user.login}
    </Link>
  </Paper>
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

const UsersPageContent = props => 
  <WindowScroller>
    {({ height, isScrolling, scrollTop }) => (
      <Collection 
        cellCount={props.users.length}
        cellRenderer={({ index, key, style }) => 
          <User user={props.users[index]} 
            key={key} style={style} />}
        cellSizeAndPositionGetter={({ index }) => ({
          height: props.rowHeight,
          width: props.columnWidth,
          x: (index % props.columns) * props.columnWidth,
          y: Math.trunc(index / props.columns) * props.rowHeight,
        })}
        height={height}
        width={props.columnWidth * props.columns}

        isScrolling={isScrolling}
        scrollTop={scrollTop}
        autoHeight
        {...props}
      />
    )}
  </WindowScroller>;

UsersPageContent.defaultProps = {
  columns: 5,
  columnWidth: 150,
  rowHeight: 150,
};


export const UsersPage = connect(
  state => ({ 
    users: _.chain(state.users)
      .map(user => ({
        ...user,
        stat: _.chain(state.userToStats[user.id])
          .reduce((acc, repoStats, repoId) => ({ 
            ...acc,
            total: acc.total + repoStats.total 
          }), { 
            total: 0,
            repos: state.userToRepos[user.id],
            followers: state.userToFollowers[user.id],
          })
          .value(),
        
      }))
      .sortBy(user => -user.stat.total)
      .value()
      // .slice(0, 30),
  }),
  dispatch => ({}),
)(props => {
  return (
    <div>
      <Toolbar>
        <ToolbarGroup>
          <RankFilter />
        </ToolbarGroup>
      </Toolbar>
      <UsersPageContent 
        style={{
          margin: '4px auto',
        }}
        {...props}
      />
    </div>);
});