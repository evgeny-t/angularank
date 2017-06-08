import { createStore } from 'redux';
import all from './dux';

describe('stats', () => {
  describe('#updateRepoStat', () => {
    it('should map repos to user-to-stats', () => {
      const store = createStore(all.reducer, {});
      store.dispatch(all.updateRepoStat({
        id: 1337,
      }, [{
        author: {
          id: 0xdead,
        },
        weeks: [],
        total: 9000,
      }]));
      expect(store.getState()).toEqual({
        repoToStats: {
          1337: {
            0xdead: {
              total: 9000,
              weeks: [],
            }
          }
        }
      });
    });
  });

  describe('#updateUserStat', () => {
    it('should map users to repo-to-stats', () => {
      const store = createStore(all.reducer, {});
      store.dispatch(all.updateUserStat({ id: 0xbeaf, }, [{
        author: { id: 0x1337 },
        weeks: [],
        total: 42,
      }]));
      expect(store.getState()).toEqual({
        userToStats: {
          0x1337: {
            0xbeaf: {
              weeks: [],
              total: 42,
            },
          },
        },
      });
    })
  });
});
