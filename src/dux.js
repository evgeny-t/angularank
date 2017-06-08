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
          weeks: curr.weeks,
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
            weeks: data.weeks,
          }
        }, 
      }
    }), state),

});

const { reducer: usersReducer, ...userActions } = createDux({
  setUsers: (state, users) => ({ ...state, users }),
  addUsers: (state, users) => ({ 
    ...state, 
    users: [].concat(state.users || [], users)
  }),
});

const { reducer: reposReducer, ...reposActions } = createDux({
  setRepos: (state, repos) => ({ 
    ...state, 
    repos: repos.reduce((acc, curr) => _.set(acc, curr.id, curr), {}),
  }),
});

export default {
  ...statActions,
  ...userActions,
  ...reposActions,
  reducer: combine(
    statReducer, 
    usersReducer, 
    reposReducer),
};
