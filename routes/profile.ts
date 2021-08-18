import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

import Validate from '../validations/profile';
import isAuth from '../middleware/auth';
import { user } from '../interface';

const router = express.Router();
const prisma = new PrismaClient();

// @route   GET api/profile/
// @desc    Getting Logged In User Profile
// @access  Private(User)
router.get('/', isAuth, async (req: Request, res: Response) => {
  const { id } = <user>req.user;

  try {
    const profile = await prisma.profile.findFirst({
      select: {
        id: true,
        dob: true,
        isAdmin: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
        rentals: {
          select: {
            id: true,
            movie: {
              select: {
                id: true,
                movieName: true,
              },
            },
            rentalAt: true,
          },
        },
      },
      where: {
        userId: id,
      },
    });

    if (!profile)
      return res
        .status(404)
        .json({ profile: 'No Profile exists for current User' });

    return res.json(profile);
  } catch (err) {
    return res.status(500).send('Internal Server Error');
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

  const { id } = <user>req.user;
  const isAdmin = req.body.isAdmin ? req.body.isAdmin : false;
  const data = {
    dob: <Date>new Date(req.body.dob),
    userId: <number>id,
    isAdmin: <boolean>isAdmin,
  };
  try {
    const response = await prisma.profile.upsert({
      select: {
        id: true,
        dob: true,
        isAdmin: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      create: data,
      where: {
        userId: id,
      },
      update: data,
    });

    return res.json(response);
  } catch (err) {
    return res.status(500).send('Internal Server Error');
  }
});

// @route   PUT api/profile/
// @desc    Deleting Logged In User Profile
// @access  Private(User)
router.delete('/', isAuth, async (req: Request, res: Response) => {
  const { id } = <user>req.user;

  try {
    const profile: any = await prisma.profile.findUnique({
      include: {
        rentals: true,
      },
      where: {
        userId: id,
      },
    });

    if (!profile)
      return res
        .status(404)
        .json({ profile: 'No Profile exists for current User' });
    else {
      if (profile.rentals.length > 0)
        return res
          .status(403)
          .json({ rentals: 'Please pay your rentals first' });

      await prisma.profile.delete({
        where: {
          userId: id,
        },
      });

      return res.json({ deleted: true });
    }
  } catch (err) {
    return res.status(500).send('Internal Server Error');
  }
});

// @route   GET api/profile/rental/:id
// @desc    Get info about a particular rental
// @access  Private(User)
router.get('/rental/:id', isAuth, async (req, res) => {
  const { id } = <user>req.user;
  const rentalId = parseInt(req.params.id);
  try {
    const profile = await prisma.profile.findFirst({
      select: {
        id: true,
        rentals: true,
      },
      where: {
        userId: id,
      },
    });

    if (!profile)
      return res
        .status(404)
        .json({ profile: 'No Rentals for User as User has no Profile' });

    const rent = profile.rentals.filter(rental => rental.id === rentalId)[0];
    if (!rent) return res.status(404).json({ rental: 'Invalid Rental ID' });

    const response = await prisma.$queryRaw(`SELECT r.id, m.movieName, rentalAt, m.rentPerDay, m.id,
          ROUND(((utc_timestamp() - rentalAt) / 86400) * m.rentPerDay, 2) AS rental
          FROM rentals r
          JOIN movies m
          WHERE r.movieId = m.id AND r.id = ${rentalId}`);

    return res.json(response[0]);
  } catch (err) {
    return res.status(500).send('Internal Server Error');
  }
});

// @route   POST api/profile/add-rental/:movieId
// @desc    Adding Rental to Profile
// @access  Private(User)
router.post('/add-rental/:movieId', isAuth, async (req, res) => {
  const { id } = <user>req.user;
  const movieId = parseInt(req.params.movieId);
  try {
    const profile = await prisma.profile.findUnique({
      select: {
        id: true,
        rentals: true,
      },
      where: {
        userId: id,
      },
    });
    const profileId = <number>profile?.id;

    if (!profile)
      return res.status(404).json({ profile: 'No Profile for User' });

    const movie = profile.rentals.filter(
      rental => rental.movieId === movieId
    )[0];
    if (movie)
      return res
        .status(403)
        .json({ profile: 'You already have a rental for this movie' });

    if (profile.rentals.length === 5)
      return res.status(403).json({
        profile:
          "You've reached your quota of 5 rentals please return your rentals first",
      });

    const movie_exist = await prisma.movie.findUnique({
      where: {
        id: movieId,
      },
    });

    if (!movie_exist)
      return res.status(404).json({ movie: 'No movie with given id found' });

    await prisma.movie.update({
      data: {
        rentalLeft: {
          decrement: 1,
        },
      },
      where: {
        id: movieId,
      },
    });

    const response = await prisma.rental.create({
      data: {
        profileId,
        movieId,
      },
      select: {
        movie: {
          select: {
            id: true,
            movieName: true,
          },
        },
        rentalAt: true,
        profileId: true,
      },
    });

    return res.json(response);
  } catch (err) {
    return res.status(500).send('internal Server Error');
  }
});

// @route   POST api/profile/pay-rental/:movieId
// @desc    Returning particular Rental
// @access  Private(User)
router.post('/pay-rental/:movieId', isAuth, async (req, res) => {
  const { id } = <user>req.user;
  const movieId = parseInt(req.params.movieId);
  try {
    const profile = await prisma.profile.findUnique({
      select: {
        id: true,
        rentals: true,
      },
      where: {
        userId: id,
      },
    });
    const profileId = <number>profile?.id;

    if (!profile)
      return res.status(404).json({ profile: 'No Profile for User' });

    const rental_exist = await prisma.rental.findFirst({
      select: {
        id: true,
      },
      where: {
        AND: [{ movieId }, { profileId }],
      },
    });
    const rentalId = <number>rental_exist?.id;

    if (!rental_exist)
      return res.status(404).json({ rental: 'Rental with given ID not found' });

    await prisma.movie.update({
      data: {
        rentalLeft: {
          increment: 1,
        },
      },
      where: {
        id: movieId,
      },
    });
    await prisma.rental.delete({
      where: {
        id: rentalId,
      },
    });

    return res.json({ rental: 'returned' });
  } catch (err) {
    return res.status(500).send('Internal Server Error');
  }
});

export default router;
