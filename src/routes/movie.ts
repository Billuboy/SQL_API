import express, { Request, Response } from 'express';

import db from '../db/dbOpen';
import isAuth from '../middleware/auth';
import isAdmin from '../middleware/admin';
import Validate from '../validations/movie';

const router = express.Router();

// @route   GET api/movie/movie/:id
// @desc    Get Movie by ID
// @access  Public
router.get('/movie/:id', async (req: Request, res: Response) => {
  try {
    const movie = await db('movies').where('movie_id', req.params.id);
    return res.json(movie);
  } catch (err) {
    return res.status(500).send('Internal Server Error');
  }
});

// @route   GET api/movie/all
// @desc    Get all Movies
// @access  Public
router.get('/all', async (req: Request, res: Response) => {
  try {
    const movies = await db('movies');
    return res.json(movies);
  } catch (err) {
    return res.status(500).send('Internal Server Error');
  }
});

// @route   POST api/movie/create
// @desc    Creating new Movie
// @access  Private(Admin)
router.post('/', isAuth, isAdmin, async (req: Request, res: Response) => {
  const valid = await Validate(req.body);
  if (valid !== undefined) {
    return res.status(400).json(valid);
  }

  const stars = req.body.stars ? req.body.stars : db.raw('DEFAULT');
  try {
    const response: any = await db('movies')
      .select('movie_id')
      .where('movie_name', req.body.movie_name);

    if (response.length > 0)
      return res.status(400).json({ movie: 'Movie Already exists' });
    else {
      const insertId = await db('movies').insert({
        movie_name: req.body.movie_name,
        number_in_stock: req.body.number_in_stock,
        rental_per_day: req.body.rental_per_day,
        stars: stars,
      });

      const inserted_movie = await db('movies').where('movie_id', insertId[0]);
      return res.json(inserted_movie[0]);
    }
  } catch (err) {
    return res.status(500).send('Internal Server Error');
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

  try {
    const resp: any = await db('movies')
      .select('movie_id', 'movie_name')
      .where('movie_id', req.params.id);
    const response = JSON.parse(JSON.stringify(resp));

    if (response[0].movie_name !== req.body.movie_name) {
      const movie = await db('movies')
        .select('movie_id')
        .where('movie_name', req.body.movie_name);
      if (movie.length > 0)
        return res
          .status(400)
          .json({ movie: 'Movie with given name already exists' });
    }

    if (response.length === 0)
      return res.status(404).json({ movie: 'No movie with given id exists' });
    else {
      const stars = req.body.stars ? req.body.stars : db.raw('DEFAULT');
      await db('movies').update({
        movie_name: req.body.movie_name,
        number_in_stock: req.body.number_in_stock,
        rental_per_day: req.body.rental_per_day,
        stars: stars,
      });

      const updated_movie = await db('movies').where('movie_id', req.params.id);
      return res.json(updated_movie[0]);
    }
  } catch (err) {
    console.log(err);
    return res.status(500).send('Internal Server Error');
  }
});

// @route   DELETE api/movie/:id
// @desc    Deleting Movie with given ID
// @access  Private(Admin)
router.delete('/:id', isAuth, isAdmin, async (req: Request, res: Response) => {
  try {
    const response: any = await db('movies')
      .select('movie_id')
      .where('movie_id', req.params.id);

    if (response.length === 0)
      return res.status(404).json({ movie: 'No movie with given id exists' });
    else {
      await db('movies').delete().where('movie_id', req.params.id);
      return res.json({ deleted: true });
    }
  } catch (err) {
    return res.status(500).send('Internal Server Error');
  }
});

export default router;
