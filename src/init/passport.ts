import passport from 'passport';
import { Application } from 'express';
import '../config/passport';

export default (app: Application): any => {
  app.use(passport.initialize());
  app.use(passport.session());
};
