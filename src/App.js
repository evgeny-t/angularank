import React, { Component } from 'react';
import { connect } from 'react-redux';
import logo from './logo.svg';
import './App.css';

class App extends Component {
  render() {
    return (
      <div className="App">
        <div className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h2>Welcome to React</h2>
        </div>
        <p className="App-intro">
          To get started, edit <code>src/App.js</code> and save to reload.
        </p>
        {this.props.users && this.props.users.map(user => 
          <div style={{
            height: 100,
            width: 100,
            display: 'inline-block',
            border: '1px solid #ee1',
          }}>
            <img width={50} height={50} src={user.avatar_url} />
          </div>)}
      </div>
    );
  }
}

export default connect(
  state => ({ users: state.users }),
  dispatch => ({}),
)(App);
