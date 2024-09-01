import pg from "pg"
import { config } from "dotenv"
config()


const { Client } = pg;

let client;

export async function getConnection(){
    if (!client) {
        client = new Client({
            connectionString: process.env.CREATORX_DB_LINK,
            ssl: {
                rejectUnauthorized: false,
            },
        });

        try {
            await client.connect();
            console.log("Connected to creatorX DB");
        } catch (err) {
            console.log(`Error in connecting to db: ${err.message}`);
            throw new Error('Failed to connect to database');
        }
    }
    return client;
}
