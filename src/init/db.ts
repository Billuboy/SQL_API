import db from '../db/dbOpen';

function dbInit():void {
  db.connect(function (err) {
    if (err) {
      console.log('Error connecting to database');
      return;
    }

    console.log('Connected to MySQL');
    return;
  });
}

export default dbInit;
