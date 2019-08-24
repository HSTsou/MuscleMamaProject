import { combineEpics } from 'redux-observable';
import { combineReducers } from 'redux';

import app, { appEpic } from './modules/application';
import user, { userEpic } from './modules/user';

export const rootEpic = combineEpics(
  appEpic,
  userEpic,
);

export const rootReducer = combineReducers({
  app,
  user,
});
