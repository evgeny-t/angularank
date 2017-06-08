import _ from 'lodash';

export var combine = (...reducers) => (state, action) => {
  for (let i = 0; i < reducers.length; ++i) {
    let newState = reducers[i](state, action);
    if (newState !== undefined && newState !== state) {
      return newState;
    }
  }
  return state;
}

export var createDux = options => {
  return { 
    ..._.reduce(options, (acc, val, key) => 
      _.set(acc, key, (...args) => ({ type: _.snakeCase(key).toUpperCase(), args })), {}),
    reducer: combine(
      ..._.map(options, (val, key) => 
        (state, { type, args }) => 
          type === _.snakeCase(key).toUpperCase() ? val(state, ...args) : state)),
  };
};
