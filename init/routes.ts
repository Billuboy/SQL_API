import express, { Application } from 'express';

import auth from '../routes/auth';
import profile from '../routes/profile';
import movie from '../routes/movie';

export default (app: Application): any => {
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));
  app.use('/api/auth/', auth);
  app.use('/api/profile/', profile);
  app.use('/api/movie/', movie);
};
