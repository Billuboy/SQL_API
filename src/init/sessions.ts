import { Application } from 'express';
import session from 'express-session';
import Store from 'express-mysql-session';
import dotenv from 'dotenv';

import { options } from '../db/dbOpen';

dotenv.config();

const MySQLStore = Store(<any>session);
const sessionStore = new MySQLStore(options);

export default (app: Application): any => {
  app.use(
    session({
      secret: <string>process.env.SESSION_SECRET,
      resave: false,
      saveUninitialized: true,
      store: sessionStore,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24,
      },
    })
  );
};
