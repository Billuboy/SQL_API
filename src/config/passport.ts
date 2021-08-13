import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';

import db from '../db/dbOpen';

const customFields = {
  usernameField: 'name',
  passwordField: 'password',
};

const verifyCallback = async (
  username: string,
  password: string,
  done: any
) => {
  const response: any = await new Promise((resolve, reject) => {
    db.query(
      'SELECT * FROM `users` WHERE name = ?',
      [username],
      (err, result) => {
        if (err) reject('Some Error Occurred');
        resolve(JSON.parse(JSON.stringify(result)));
      }
    );
  });

  if (response.length > 0) {
    const data: any = await new Promise((resolve, reject) => {
      db.query(
        'SELECT user_id, name FROM `users` WHERE name = ?',
        [username],
        (err, result) => {
          if (err) reject('Some Error Occurred');
          resolve(JSON.parse(JSON.stringify(result))[0]);
        }
      );
    });

    const match = await bcrypt.compare(password, response[0].password);
    if (!match)
      return done(null, false, {
        password: 'Incorrect Password',
      });

    return done(null, data);
  } else {
    return done(null, false, {
      name: 'Invalid Username',
    });
  }
};

const strategy = new LocalStrategy(customFields, verifyCallback);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user: any, done) => {
  db.query(
    'SELECT user_id, name FROM `users` WHERE user_id = ?',
    [user.user_id],
    (err, res) => {
      if (err) done(err);

      const json = JSON.parse(JSON.stringify(res))[0];
      done(null, json);
    }
  );
});

passport.use(strategy);

export default passport;
