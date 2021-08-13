import { Request, Response, NextFunction } from 'express';

export default (req: Request, res: Response, next: NextFunction): any => {
  if (!req.isAuthenticated())
    return res.status(401).json({ user: 'Unauthorized' });
  return next();
};
