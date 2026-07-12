import pkg from 'pg';
const { Client } = pkg;

import 'dotenv/config';
const connectionString = process.env.DATABASE_URL || '';

const client = new Client({ connectionString });

client.connect()
  .then(() => {
    console.log('Connected successfully!');
    return client.query('SELECT NOW()');
  })
  .then((res) => {
    console.log(res.rows);
    client.end();
  })
  .catch((err) => {
    console.error('Connection failed:', err.message);
    client.end();
  });
