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
  try {
    const response: any = await db('users').where('name', username);

    if (response.length > 0) {
      const data: any = await db('users')
        .select('user_id', 'name')
        .where('name', username);

      const match = await bcrypt.compare(password, response[0].password);
      if (!match)
        return done(null, false, {
          password: 'Incorrect Password',
        });

      return done(null, JSON.parse(JSON.stringify(data))[0]);
    } else {
      return done(null, false, {
        name: 'Invalid Username',
      });
    }
  } catch (err) {
    done(err);
  }
};

const strategy = new LocalStrategy(customFields, verifyCallback);

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser(async (user: any, done) => {
  try {
    const response = await db('users')
      .select('user_id', 'name')
      .where('user_id', user.user_id);
    done(null, JSON.parse(JSON.stringify(response))[0]);
  } catch (err) {
    done(err);
  }
});

passport.use(strategy);

export default passport;
