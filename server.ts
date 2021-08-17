import express from 'express';

import passport from './init/passport';
import routes from './init/routes';
import initSession from './init/sessions';

const app = express();
initSession(app);
passport(app);
routes(app);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Listening at port ${PORT}...`));
