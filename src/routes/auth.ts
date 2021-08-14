import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import passport from 'passport';

import Validate from '../validations/auth';
import db from '../db/dbOpen';

const router = express.Router();

// @route   POST api/auth/login
// @desc    Sign In User
// @access  Public
router.post(
  '/login',
  passport.authenticate('local'),
  (req: Request, res: Response) => {
    return res.json({ user: 'Logged In' });
  }
);

// @route   POST api/auth/register
// @desc    Registering User
// @access  Public
router.post('/register', async (req: Request, res: Response) => {
  const valid = await Validate(req.body);
  if (valid !== undefined) {
    return res.status(400).json(valid);
  }

  try {
    const response: any = await db('users')
      .select('user_id')
      .where('name', req.body.name);

    if (response.length > 0) {
      res.status(400).json({ user: 'User Already exists' });
      return;
    } else {
      const { password } = req.body;
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);

      const insertId = await db('users').insert({
        name: req.body.name,
        password: hash,
      });

      const user = await db('users')
        .select('name', 'user_id')
        .where('user_id', insertId[0]);

      return res.json(user[0]);
    }
  } catch (err) {
    return res.status(500).send('Internal Server Error');
  }
});

// @route   POST api/auth/logout
// @desc    Logging User Out
// @access  Public
router.post('/logout', (req: Request, res: Response) => {
  req.logout();
  return res.json({ user: 'Logged Out' });
});

// @route   GET api/auth/status
// @desc    Checking User Login Status
// @access  Public
router.get('/status', (req: Request, res: Response) => {
  const auth = req.isAuthenticated();
  return res.json({ auth: auth });
});

export default router;
