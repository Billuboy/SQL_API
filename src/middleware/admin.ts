import { Request, Response, NextFunction } from 'express';
import db from '../db/dbOpen';

export default (req: Request, res: Response, next: NextFunction): any => {
  (async (req, res, next): Promise<any> => {
    const { user_id }: any = req.user;

    const admin: any = await new Promise((resolve, reject) => {
      db.query(
        'SELECT isAdmin FROM `profiles` WHERE user_id = ?',
        [user_id],
        (err, result) => {
          if (err) reject('Something went wrong');
          resolve(JSON.parse(JSON.stringify(result)));
        }
      );
    });

    if (admin.length === 0)
      return res.status(404).json({ profile: 'User has no profile' });

    const { isAdmin } = admin;
    if (!isAdmin) return res.status(401).json({ user: 'Unauthorized Access' });

    return next();
  })(req, res, next);
};
