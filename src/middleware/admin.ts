import { Request, Response, NextFunction } from 'express';
import db from '../db/dbOpen';

export default (req: Request, res: Response, next: NextFunction): any => {
  (async (): Promise<any> => {
    const { user_id }: any = req.user;

    try {
      const admin: any = await db('profiles')
        .select('isAdmin')
        .where('user_id', user_id);

      if (admin.length === 0)
        return res.status(404).json({ profile: 'User has no profile' });

      const { isAdmin } = admin[0];
      if (!isAdmin)
        return res.status(401).json({ user: 'Unauthorized Access' });

      return next();
    } catch (err) {
      return res.status(500).send('Internal Server Error');
    }
  })();
};
