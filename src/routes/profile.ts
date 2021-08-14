import express, { Request, Response } from 'express';

import Validate from '../validations/profile';
import isAuth from '../middleware/auth';
import db from '../db/dbOpen';

const router = express.Router();

// @route   GET api/profile/
// @desc    Getting Logged In User Profile
// @access  Private(User)
router.get('/', isAuth, async (req: Request, res: Response) => {
  const { user_id }: any = req.user;

  // try {
  const response: any = await db('profiles')
    .select('profile_id')
    .where('user_id', user_id);

  if (response.length === 0)
    return res
      .status(404)
      .json({ profile: 'No Profile exists for current User' });
  else {
    const profile = await db({ p: 'profiles' })
      .join({ u: 'users' }, 'p.user_id', '=', 'u.user_id')
      .select('profile_id', 'p.user_id', 'u.name', 'dob', 'isAdmin');
    return res.json(profile[0]);
  }
  // } catch (err) {
  //   return res.status(500).send('Internal Server Error');
  // }
});

// @route   POST api/profile/
// @desc    Creating and Updating Logged In User Profile
// @access  Private(User)
router.post('/', isAuth, async (req: Request, res: Response) => {
  const valid = await Validate(req.body);
  if (valid !== undefined) {
    return res.status(400).json(valid);
  }

  const { user_id }: any = req.user;
  const isAdmin = req.body.isAdmin ? req.body.isAdmin : db.raw('DEFAULT');
  try {
    const response: any = await db('profiles').where('user_id', user_id);

    if (response.length > 0) {
      await db('profiles').update({ dob: req.body.dob, isAdmin: isAdmin });
      const updated_profile = await db({ p: 'profiles' })
        .join({ u: 'users' }, 'p.user_id', '=', 'u.user_id')
        .select('profile_id', 'u.user_id', 'u.name', 'dob', 'isAdmin')
        .where('p.user_id', user_id);

      return res.json(updated_profile[0]);
    } else {
      const insertId = await db('profiles').insert({
        dob: req.body.dob,
        user_id: user_id,
        isAdmin: isAdmin,
      });

      const profile = await db({ p: 'profiles' })
        .join({ u: 'users' }, 'p.user_id', '=', 'u.user_id')
        .select('profile_id', 'u.user_id', 'u.name', 'dob', 'isAdmin')
        .where('p.profile_id', insertId[0]);

      return res.json(profile[0]);
    }
  } catch (err) {
    return res.status(500).send('Internal Server Error');
  }
});

// @route   PUT api/profile/
// @desc    Deleting Logged In User Profile
// @access  Private(User)
router.delete('/', isAuth, async (req: Request, res: Response) => {
  const { user_id }: any = req.user;

  try {
    const response: any = await db('profiles')
      .select('profile_id')
      .where('user_id', user_id);

    if (response.length === 0)
      return res
        .status(404)
        .json({ profile: 'No Profile exists for current User' });
    else {
      const { profile_id } = JSON.parse(JSON.stringify(response))[0];
      const rentals: any = await db('rentals')
        .select('rental_id')
        .where('profile_id', profile_id);

      if (rentals.length > 0)
        return res
          .status(403)
          .json({ rentals: 'Please pay your rentals first' });
      else {
        await db('profiles').delete().where('user_id', user_id);
        return res.json({ deleted: true });
      }
    }
  } catch (err) {
    return res.status(500).send('Internal Server Error');
  }
});

// @route   GET api/profile/rental
// @desc    Get all Rentals
// @access  Private(User)
router.get('/rentals', isAuth, async (req, res) => {
  const { user_id }: any = req.user;

  try {
    const response: any = await db('profiles')
      .select('profile_id')
      .where('user_id', user_id);

    if (response.length === 0)
      return res
        .status(404)
        .json({ profile: 'No Rentals for User as User has no Profile' });
    else {
      const { profile_id } = JSON.parse(JSON.stringify(response))[0];

      const rentals = await db({ r: 'rentals' })
        .join({ m: 'movies' }, 'r.movie_id', '=', 'm.movie_id')
        .select(
          'r.rental_id',
          'm.movie_id',
          'm.movie_name',
          'purchase_time',
          'm.rental_per_day',
          db.raw(
            'ROUND(((current_timestamp() - purchase_time) / 86400) * m.rental_per_day, 2) AS rental'
          )
        )
        .where('profile_id', profile_id);
      return res.json(rentals);
    }
  } catch (err) {
    console.log(err);
    return res.status(500).send('Internal Server Error');
  }
});

// @route   POST api/profile/add-rental/:movieId
// @desc    Adding Rental to Profile
// @access  Private(User)
router.post('/add-rental/:movieId', isAuth, async (req, res) => {
  const { user_id }: any = req.user;
  const { movieId } = req.params;
  try {
    const response: any = await db('profiles')
      .select('profile_id')
      .where('user_id', user_id);

    if (response.length === 0)
      return res.status(404).json({ profile: 'No Profile for User' });
    else {
      const { profile_id } = JSON.parse(JSON.stringify(response))[0];

      const rental_check: any = await db('rentals')
        .select('movie_id')
        .whereRaw('movie_id = ? AND profile_id = ?', [movieId, profile_id]);

      if (rental_check.length > 0)
        return res
          .status(400)
          .json({ profile: 'You already have a rental for this movie' });

      const rentals: any = await db('rentals')
        .select('rental_id')
        .where('profile_id', profile_id);

      if (rentals.length === 5)
        return res.status(400).json({
          profile:
            "You've reached your quota of 5 rentals, please return your rentals first",
        });

      const number: any = await db('movies')
        .select('number_in_stock')
        .where('movie_id', movieId);
      const number_json = JSON.parse(JSON.stringify(number))[0];

      if (number_json?.number_in_stock === 0 || !number_json)
        return res.status(400).json({ movie: 'No movie in stock' });
      else {
        await db('rentals').insert({
          profile_id: profile_id,
          movie_id: movieId,
        });
        await db('movies')
          .decrement('number_in_stock', 1)
          .where('movie_id', movieId);

        const rental = await db({ r: 'rentals' })
          .join({ m: 'movies' }, 'r.movie_id', '=', 'm.movie_id')
          .select('r.rental_id', 'm.movie_name', 'purchase_time')
          .where('r.movie_id', movieId);

        return res.json(rental[0]);
      }
    }
  } catch (err) {
    console.log(err);
    return res.status(500).send('Internal Server Error');
  }
});

// @route   POST api/profile/pay-rental/:movieId
// @desc    Returning particular Rental
// @access  Private(User)
router.post('/pay-rental/:movieId', isAuth, async (req, res) => {
  const { user_id }: any = req.user;
  const { movieId } = req.params;

  try {
    const response: any = await db('profiles')
      .select('profile_id')
      .where('user_id', user_id);

    if (response.length === 0)
      return res.status(404).json({ profile: 'No Profile for User' });
    else {
      const movies: any = await db('rentals')
        .select('movie_id')
        .where('movie_id', movieId);

      if (movies.length === 0)
        return res.status(404).json({ movie: 'Movie with given ID not found' });
      else {
        await db('rentals').delete().where('movie_id', movieId);
        await db('movies')
          .increment('number_in_stock', 1)
          .where('movie_id', movieId);

        return res.json({ rental: 'returned' });
      }
    }
  } catch (err) {
    return res.status(500).send('Internal Server Error');
  }
});

export default router;
