import { Response } from 'express';

export default function (res: Response): void {
  res.status(500).json({ error: 'Some internal server error occured' });
  return;
}
