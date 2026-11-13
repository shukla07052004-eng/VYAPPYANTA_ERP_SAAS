import {pool} from 'pg';

const pool = new pool({
    connectionString: process.env.DATABASE_URL
})

export default pool;