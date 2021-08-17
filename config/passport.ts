import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
    const response = await prisma.user.findFirst({
      where: {
        name: username,
      },
    });

    if (response) {
      const match = await bcrypt.compare(password, response.password);

      if (!match)
        return done(null, false, {
          password: 'Incorrect Password',
        });

      return done(null, {
        id: response.id,
        name: response.name,
      });
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
  const { id } = user;
  try {
    const response = await prisma.user.findUnique({
      select: {
        id: true,
        name: true,
      },
      where: {
        id,
      },
    });
    done(null, response);
  } catch (err) {
    done(err);
  }
});

passport.use(strategy);

export default passport;
