import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

import isAuth from '../middleware/auth';
import isAdmin from '../middleware/admin';
import Validate from '../validations/movie';

const router = express.Router();
const { movie } = new PrismaClient();

// @route   GET api/movie/movie/:id
// @desc    Get Movie by ID
// @access  Public
router.get('/movie/:id', async (req: Request, res: Response) => {
  const id: number = parseInt(req.params.id);

  try {
    const response = await movie.findUnique({
      where: {
        id: id,
      },
    });

    if (response) return res.json(response);
    return res.json([]);
  } catch (err) {
    return res.status(500).send('Internal Server Error');
  }
});

// @route   GET api/movie/all
// @desc    Get all Movies
// @access  Public
router.get('/all', async (req: Request, res: Response) => {
  try {
    const response = await movie.findMany();

    if (response) return res.json(response);
    return res.json([]);
  } catch (err) {
    return res.status(500).send('internal Server Error');
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

  const stars = req.body.stars ? req.body.stars : 0.0;
  const data = {
    movieName: <string>req.body.movieName,
    rentPerDay: <number>req.body.rentPerDay,
    rentalLeft: <number>req.body.rentalLeft,
    stars: <number>stars,
  };

  try {
    const movie_exist = await movie.findFirst({
      select: { id: true },
      where: {
        movieName: req.body.movieName,
      },
    });

    if (movie_exist)
      return res.status(403).json({ movie: 'Movie Already exists' });

    const response = await movie.create({
      data,
    });

    return res.json(response);
  } catch (err) {
    console.log(err);
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

  const id: number = parseInt(req.params.id);
  const stars = req.body.stars ? req.body.stars : 'DEFAULT';
  const data = {
    movieName: <string>req.body.movieName,
    rentPerDay: <number>req.body.rentPerDay,
    rentalLeft: <number>req.body.rentalLeft,
    stars,
  };

  try {
    const movie_with_id = await movie.findUnique({
      select: { id: true, movieName: true },
      where: { id },
    });

    if (!movie_with_id)
      return res.status(404).json({ movie: 'No movie with given id exists' });

    if (movie_with_id.movieName !== data.movieName) {
      const movie_with_name = await movie.findFirst({
        select: { id: true },
        where: {
          movieName: data.movieName,
        },
      });

      if (movie_with_name)
        return res
          .status(400)
          .json({ movie: 'Movie with given name already exists' });
    }

    const response = await movie.update({
      where: { id },
      data,
    });

    return res.json(response);
  } catch (err) {
    return res.status(500).send('Internal Server Error');
  }
});

// @route   DELETE api/movie/:id
// @desc    Deleting Movie with given ID
// @access  Private(Admin)
router.delete('/:id', isAuth, isAdmin, async (req: Request, res: Response) => {
  const id: number = parseInt(req.params.id);
  try {
    const movie_with_id = await movie.findUnique({
      select: { id: true },
      where: { id },
    });

    if (!movie_with_id)
      return res.status(404).json({ movie: 'No movie with given id exists' });

    await movie.delete({
      where: { id },
    });

    return res.json({ delete: true });
  } catch (err) {
    return res.status(500).send('Internal Server Error');
  }
});

export default router;
