import knex from 'knex';
import dotenv from 'dotenv';
dotenv.config();

export const options = {
  host: '127.0.0.1',
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: 'rentals',
}

const db = knex({
  client: 'mysql',
  connection: options
});

export default db;
