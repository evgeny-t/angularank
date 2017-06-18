import _ from 'lodash';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router-dom';

import CircularProgress from 'material-ui/CircularProgress';
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

import Measure from 'react-measure';

import { Collection, WindowScroller } from 'react-virtualized';
import 'react-virtualized/styles.css';

import { User, userToProps, } from '../User';


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
          x: (index % props.columns) * (
            props.columnWidth + props.padding),
          y: Math.trunc(index / props.columns) * 
          (props.rowHeight + props.padding),
        })}
        height={height}
        width={(props.columnWidth + props.padding) * props.columns}

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
  rowHeight: 110,
  padding: 10,
};


export const UsersPage = connect(
  state => ({ 
    loading: state.usersLoading,
    users: _.chain(state.users)
      .map(userToProps)
      .sortBy(user => -user.stat.total)
      .value()
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
      {
        props.loading ? 
          (
            <div style={{ 
              position: 'fixed',
              width: '100%', 
              height: 'calc(100% - 56px - 64px)', 
            }}>
              <CircularProgress 
                size={80} thickness={7} 
                style={{
                  position: 'absolute',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              />
            </div>
          ) : (
            <UsersPageContent 
              style={{
                margin: '4px auto',
              }}
              {...props}
            />
          )
      }
    </div>);
});
