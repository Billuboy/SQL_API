import { Application } from 'express';
import session from 'express-session';
import Store from 'express-mysql-session';
import dotenv from 'dotenv';
dotenv.config();

const MySQLStore = Store(<any>session);
const options = {
  host: '127.0.0.1',
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: 'rentals',
  multipleStatements: true,
};
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
