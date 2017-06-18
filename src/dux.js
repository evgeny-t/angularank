import _ from 'lodash';
import { combine, createDux } from './createDux';

const { reducer: statReducer, ...statActions } = createDux({
  updateRepoStat: (state, repo, data) => ({
    ...state,
    repoToStats: {
      ...(state.repoToStats || {}),
      [repo.id]: data.reduce(
        (acc, curr) => _.set(acc, curr.author.id, {
          total: curr.total,
          weeks: _.filter(curr.weeks, w => w && (w.a || w.d || w.c)),
        }), {}),
    },
  }),

  updateUserStat: (state, repo, data) => 
    data.reduce((state, data) => ({
      ...state,
      userToStats: {
        ...(state.userToStats || {}),
        [data.author.id]: {
          ..._.get(state.userToStats, data.author.id, {}),
          [repo.id]: { 
            total: data.total,
            weeks: _.filter(data.weeks, w => w && (w.a || w.d || w.c)),
          }
        }, 
      }
    }), state),

});


const { reducer: usersReducer, ...userActions } = createDux({
  setUsers: (state, users) => ({ ...state, users }),
  addUsers: (state, users = []) => {
    return ({ 
      ...state, 
      users: users.reduce((acc, user) => 
        _.set(acc, user.id, user), { ...state.users }),
    });
  },
  setUserMetrics: (state, user, metrics, value) => ({
    ...state,
    [metrics]: {
      ...state[metrics],
      [user.id]: value,
    }
  }),
});

const { reducer: reposReducer, ...reposActions } = createDux({
  setRepos: (state, repos) => ({ 
    ...state, 
    repos: repos.reduce((acc, curr) => _.set(acc, curr.id, curr), {}),
  }),
});

const { reducer: setReducer, ...setActions } = createDux({
  set: (state, path, value) => _.set(_.clone(state), path, value),
});

export default {
  ...statActions,
  ...userActions,
  ...reposActions,
  ...setActions,
  reducer: combine(
    statReducer, 
    usersReducer, 
    reposReducer,
    setReducer),
};
