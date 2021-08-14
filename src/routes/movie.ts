import express, { Request, Response } from 'express';

import db from '../db/dbOpen';
import isAuth from '../middleware/auth';
import isAdmin from '../middleware/admin';
import Validate from '../validations/movie';

const router = express.Router();

// @route   GET api/movie/movie/:id
// @desc    Get Movie by ID
// @access  Public
router.get('/movie/:id', (req: Request, res: Response) => {
  db.query(
    'SELECT * FROM `movies` WHERE movie_id = ?',
    [req.params.id],
    function (err, result) {
      if (err) return res.status(500).json({ server: 'Internal Server Error' });

      const response = JSON.parse(JSON.stringify(result, null, 4));
      return res.json(response);
    }
  );
});

// @route   GET api/movie/all
// @desc    Get all Movies
// @access  Public
router.get('/all', (req: Request, res: Response) => {
  db.query('SELECT * FROM `movies`', function (err, result) {
    if (err) return res.status(500).json({ server: 'Internal Server Error' });

    const response = JSON.parse(JSON.stringify(result, null, 4));
    return res.json(response);
  });
});

// @route   POST api/movie/create
// @desc    Creating new Movie
// @access  Private(Admin)
router.post('/', isAuth, isAdmin, async (req: Request, res: Response) => {
  const valid = await Validate(req.body);
  if (valid !== undefined) {
    return res.status(400).json(valid);
  }

  const stars = req.body.stars ? req.body.stars : null;
  const response: any = await new Promise((resolve, reject) => {
    db.query(
      'SELECT movie_id from `movies` WHERE movie_name = ?',
      [<string>req.body.movie_name],
      function (err, result) {
        if (err) reject('Something went wrong');
        resolve(result);
      }
    );
  });

  if (response.length > 0) {
    res.status(403).json({ movie: 'Movie Already exists' });
    return;
  } else {
    db.query(
      `INSERT INTO movies (movie_name, number_in_stock, rental_per_day, stars) VALUES (?, ?, ?, ${
        stars ? stars : 'DEFAULT'
      })`,
      [
        <string>req.body.movie_name,
        <number>req.body.number_in_stock,
        <number>req.body.rental_per_day,
      ],
      (error, results) => {
        db.query(
          'SELECT * FROM `movies` WHERE `movie_id` = ?',
          [results.insertId],
          (err, result: any) => {
            const json = JSON.parse(JSON.stringify(result, null, 4))[0];
            return res.json(json);
          }
        );
      }
    );
  }
});

// @route   PUT api/movie/:id
// @desc    Updating Movie with given ID
// @access  Private(Admin)
router.put('/:id', isAuth, isAdmin, async (req: Request, res: Response) => {
  const valid = await Validate(req.body);
  if (valid !== undefined) {
    return res.status(400).json(valid);
  }

  const response: any = await new Promise((resolve, reject) => {
    db.query(
      'SELECT movie_id from `movies` WHERE movie_id = ?',
      [<string>req.params.id],
      function (err, result) {
        if (err) reject('Something went wrong');
        resolve(result);
      }
    );
  });

  if (response[0].movie_name !== req.body.movie_name) {
    const movie = await new Promise((resolve, reject) => {
      db.query(
        'SELECT movie_id from `movies` WHERE movie_name = ?',
        [<string>req.params.movie_name],
        function (err, result) {
          if (err) reject('Something went wrong');
          resolve(result);
        }
      );
    });

    const movie_exist = JSON.parse(JSON.stringify(movie));
    if (movie_exist.length > 0)
      return res
        .status(400)
        .json({ movie: 'Movie with given name already exists' });
  }

  if (response.length === 0)
    return res.status(404).json({ movie: 'No movie with given id exists' });
  else {
    const stars = req.body.stars ? req.body.stars : null;
    db.query(
      `UPDATE movies SET movie_name = ?, number_in_stock = ?, rental_per_day = ?, stars = ${
        stars ? stars : 'DEFAULT'
      };
      SELECT * FROM movies WHERE movie_id = ${req.params.id}
        `,
      [
        <string>req.body.movie_name,
        <number>req.body.number_in_stock,
        <number>req.body.rental_per_day,
      ],
      function (err, results) {
        const movie = JSON.parse(JSON.stringify(results[1]))[0];
        return res.json(movie);
      }
    );
  }
});

// @route   DELETE api/movie/:id
// @desc    Deleting Movie with given ID
// @access  Private(Admin)
router.delete('/:id', isAuth, isAdmin, async (req: Request, res: Response) => {
  const response: any = await new Promise((resolve, reject) => {
    db.query(
      'SELECT movie_id from `movies` WHERE movie_id = ?',
      [<string>req.params.id],
      function (err, result) {
        if (err) throw new Error('Something went wrong');
        resolve(result);
      }
    );
  });

  if (response.length === 0)
    return res.status(404).json({ movie: 'No movie with given id exists' });
  else {
    db.query(
      'DELETE FROM `movies` WHERE movie_id = ?',
      [req.params.id],
      function (error) {
        return res.json({ deleted: true });
      }
    );
  }
});

export default router;
