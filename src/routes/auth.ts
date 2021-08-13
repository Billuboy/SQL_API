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

  const response: any = await new Promise((resolve, reject) => {
    db.query(
      'SELECT user_id from `users` WHERE name = ?',
      [<string>req.body.name],
      function (err, result) {
        if (err) throw new Error('Something went wrong');
        resolve(result);
      }
    );
  });

  if (response.length > 0) {
    res.status(403).json({ user: 'User Already exists' });
    return;
  } else {
    const { password } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const userId = await new Promise((resolve, reject) => {
      db.query(
        'INSERT INTO `users` (name, password) VALUES (?, ?);',
        [req.body.name as string, <string>hash],
        (error, results) => {
          resolve(results.insertId);
        }
      );
    });

    db.query(
      'SELECT name FROM `users` WHERE `user_id` = ?',
      [userId],
      (err, result: any) => {
        const json = JSON.parse(JSON.stringify(result, null, 4))[0];
        return res.json(json);
      }
    );
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
