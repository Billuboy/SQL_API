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

  const response: any = await new Promise((resolve, reject) => {
    db.query(
      `SELECT user_id FROM profiles WHERE user_id = ?`,
      [<number>user_id],
      (err, result) => {
        if (err) reject(err);

        resolve(JSON.parse(JSON.stringify(result)));
      }
    );
  });

  if (response.length === 0)
    return res
      .status(404)
      .json({ profile: 'No Profile exists for current User' });
  else {
    db.query(
      'SELECT profile_id, p.user_id, u.name, dob, isAdmin FROM profiles p INNER JOIN users u USING (user_id) WHERE p.user_id = ?',
      [<number>user_id],
      (err, result) => {
        return res.json(JSON.parse(JSON.stringify(result))[0]);
      }
    );
  }
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

  const response: any = await new Promise((resolve, reject) => {
    db.query(
      'SELECT * FROM `profiles` WHERE user_id = ?',
      [user_id],
      (err, result) => {
        if (err) reject(err);
        resolve(JSON.parse(JSON.stringify(result)));
      }
    );
  });

  const { isAdmin }: any = req.body;

  if (response.length > 0) {
    db.query(
      `UPDATE profiles SET dob = ?, isAdmin = ${isAdmin ? isAdmin : 'DEFAULT'};
      SELECT profile_id, u.user_id, u.name, dob, isAdmin FROM profiles p JOIN users u USING (user_id) WHERE p.user_id = ?;
        `,
      [<string>req.body.dob, user_id],
      function (err, results) {
        const profile = JSON.parse(JSON.stringify(results[1]))[0];
        return res.json(profile);
      }
    );
  } else {
    db.query(
      `INSERT INTO profiles (dob, user_id, isAdmin) VALUES (?, ?, ${
        isAdmin ? isAdmin : 'DEFAULT'
      })`,
      [req.body.dob, user_id],
      (error, results) => {
        db.query(
          'SELECT profile_id, u.user_id, u.name, dob, isAdmin FROM profiles p JOIN users u USING (user_id) WHERE `profile_id` = ?',
          [results.insertId],
          (err, result: any) => {
            const json = JSON.parse(JSON.stringify(result, null, 4))[0];
            return res.json(json);
          }
        );
        return res.json({ made: 'true' });
      }
    );
  }
});

// @route   PUT api/profile/
// @desc    Deleting Logged In User Profile
// @access  Private(User)
router.delete('/', isAuth, async (req: Request, res: Response) => {
  const { user_id }: any = req.user;

  const response: any = await new Promise((resolve, reject) => {
    db.query(
      'SELECT * FROM `profiles` WHERE user_id = ?',
      [user_id],
      (err, result) => {
        if (err) reject(err);
        resolve(JSON.parse(JSON.stringify(result)));
      }
    );
  });

  if (response.length === 0)
    return res
      .status(404)
      .json({ profile: 'No Profile exists for current User' });
  else {
    const { profile_id } = response[0];
    const rentals: any = await new Promise((resolve, reject) => {
      db.query(
        'SELECT rental_id FROM `rentals` WHERE profile_id = ?',
        [profile_id],
        (err, result) => {
          resolve(JSON.parse(JSON.stringify(result)));
        }
      );
    });

    if (rentals.length > 0)
      return res.status(403).json({ rentals: 'Please pay your rentals first' });
    else {
      db.query('DELETE FROM `profiles` WHERE user_id = ?', [user_id], function (
        error
      ) {
        return res.json({ deleted: true });
      });
    }
  }
});

// @route   GET api/profile/rental
// @desc    Get all Rentals
// @access  Private(User)
router.get('/rentals', isAuth, async (req, res) => {
  const { user_id }: any = req.user;

  const response: any = await new Promise((resolve, reject) => {
    db.query(
      `SELECT * FROM profiles WHERE user_id = ?`,
      [<number>user_id],
      (err, result) => {
        if (err) reject(err);
        resolve(JSON.parse(JSON.stringify(result)));
      }
    );
  });

  if (response.length === 0)
    return res
      .status(404)
      .json({ profile: 'No Rentals for User as User has no Profile' });
  else {
    const { profile_id } = response[0];

    db.query(
      ` SELECT r.rental_id, m.movie_name, purchase_time, m.rental_per_day, m.movie_id,
        ROUND(((current_timestamp() - purchase_time) / 86400) * m.rental_per_day, 2) AS rental
        FROM rentals r 
        JOIN movies m
        USING (movie_id)
        WHERE profile_id = ? ;`,
      [<string>profile_id],
      (err, result) => {
        return res.json(JSON.parse(JSON.stringify(result)));
      }
    );
  }
});

// @route   POST api/profile/add-rental/:movieId
// @desc    Adding Rental to Profile
// @access  Private(User)
router.post('/add-rental/:movieId', isAuth, async (req, res) => {
  const { user_id }: any = req.user;
  const { movieId } = req.params;

  const response: any = await new Promise((resolve, reject) => {
    db.query(
      `SELECT profile_id FROM profiles WHERE user_id = ?`,
      [<number>user_id],
      (err, result) => {
        if (err) reject(err);
        resolve(JSON.parse(JSON.stringify(result)));
      }
    );
  });

  if (response.length === 0)
    return res.status(404).json({ profile: 'No Profile for User' });
  else {
    const { profile_id } = response[0];
    const movies: any = await new Promise((resolve, reject) => {
      db.query(
        `SELECT number_in_stock FROM movies WHERE movie_id = ?;
        SElECT movie_id FROM rentals WHERE movie_id = ? AND profile_id = ?;
        SELECT rental_id FROM rentals WHERE profile_id = ? ;
        `,
        [movieId, movieId, profile_id, profile_id],
        (err, result) => {
          resolve(JSON.parse(JSON.stringify(result)));
        }
      );
    });

    if (movies[1].length > 0)
      return res
        .status(403)
        .json({ profile: 'You already have a rental for this movie' });

    if (movies[2].length === 5)
      return res.status(403).json({
        profile:
          "You've reached your quota of 5 rentals please return your rentals first",
      });

    if (movies[0].number_in_stock === 0 || !movies[0])
      return res.status(403).json({ movie: 'No movie in stock' });
    else {
      db.query(
        `INSERT INTO rentals (profile_id, movie_id) VALUES (?, ?);
          UPDATE movies SET number_in_stock = number_in_stock - 1 WHERE movie_id = ?;`,
        [profile_id, movieId, movieId, movieId],
        (err, result) => {
          db.query(
            `SELECT r.rental_id, m.movie_name, purchase_time
            FROM rentals r 
            JOIN movies m
            USING (movie_id) WHERE movie_id = ?`,
            [movieId],
            (err, result) => {
              return res.json(JSON.parse(JSON.stringify(result))[0]);
            }
          );
        }
      );
    }
  }
});

// @route   POST api/profile/pay-rental/:movieId
// @desc    Returning particular Rental
// @access  Private(User)
router.post('/pay-rental/:movieId', isAuth, async (req, res) => {
  const { user_id }: any = req.user;
  const { movieId } = req.params;

  const response: any = await new Promise((resolve, reject) => {
    db.query(
      `SELECT profile_id FROM profiles WHERE user_id = ?`,
      [<number>user_id],
      (err, result) => {
        if (err) reject(err);
        resolve(JSON.parse(JSON.stringify(result)));
      }
    );
  });

  if (response.length === 0)
    return res.status(404).json({ profile: 'No Profile for User' });
  else {
    const movies: any = await new Promise((resolve, reject) => {
      db.query(
        'SELECT movie_id FROM rentals WHERE movie_id = ?',
        [movieId],
        (err, result) => {
          resolve(JSON.parse(JSON.stringify(result)));
        }
      );
    });

    if (movies.length === 0)
      return res.status(404).json({ movie: 'Movie with given ID not found' });
    else {
      db.query(
        `DELETE FROM rentals WHERE movie_id = ?;
        UPDATE movies SET number_in_stock = number_in_stock + 1 WHERE movie_id = ?;
        `,
        [movieId, movieId],
        (err, result) => {
          return res.json({ rental: 'returned' });
        }
      );
    }
  }
});

export default router;
