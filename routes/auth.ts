import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import passport from 'passport';
import { PrismaClient } from '@prisma/client';

import Validate from '../validations/auth';

const router = express.Router();
const { user } = new PrismaClient();

// @route   POST api/auth/login
// @desc    Sign In User
// @access  Public
router.post(
  '/login',
  passport.authenticate('local'),
  (req: Request, res: Response) => res.json({ user: 'Logged In' })
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
    const User = await user.findFirst({
      select: {
        id: true,
      },
      where: {
        name: req.body.name,
      },
    });

    if (User) return res.status(403).json({ user: 'User Already exists' });
    else {
      const { password } = req.body;
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(password, salt);

      const response = await user.create({
        data: {
          name: req.body.name,
          password: hash,
        },
        select: {
          id: true,
          name: true,
        },
      });

      return res.json(response);
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
