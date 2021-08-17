import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

import { user } from '../interface';

const { profile } = new PrismaClient();

export default (req: Request, res: Response, next: NextFunction): any => {
  (async () => {
    const { id } = <user>req.user;

    try {
      const response = await profile.findFirst({
        select: {
          isAdmin: true,
        },
        where: {
          userId: id,
        },
      });

      if (!response)
        return res.status(404).json({ profile: 'User has no profile' });

      if (!response.isAdmin)
        return res.status(401).json({ user: 'Unauthorized Access' });

      return next();
    } catch (err) {
      return res.status(500).send('Internal Server Error');
    }
  })();
};
