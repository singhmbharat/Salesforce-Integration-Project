const express = require('express');
const mysql = require('mysql2/promise');
const {Connector} = require('@google-cloud/cloud-sql-connector');

const app = express();
const PORT = process.env.PORT || 8080;
//salesforcetrail-469410:asia-south1:salesforce-ext
const INSTANCE_CONNECTION_NAME = "salesforcetrail-469410:asia-south1:salesforce-ext";
const DB_USER = "Bharat_Singh";
const DB_PASS = "Yezdi@8442";
const DB_NAME = "GoogleCloudDB";

async function connectToDatabase(){
    const connector = new Connector();

    const clientOpts = await connector.getOptions({
        instanceConnectionName : INSTANCE_CONNECTION_NAME,
        ipType : 'PUBLIC',
    });

    const db = await mysql.createConnection({
        ...clientOpts,
        user: DB_USER,
        password : DB_PASS,
        database : DB_NAME,
    });

    console.log('connected to cloud sql');
    return db;
}

app.get('/', async (req, res) => {
    try {
        const db = await connectToDatabase();
        const [rows] = await db.query("SELECT NOW() as currentTime");
        await db.end();
        res.send(`DB Time: ${rows[0].currentTime}`);
    } catch (err) {
        console.error("error connecting to cloud sql ", err);
        res.status(500).send("DB connection failed");
    }
});

app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
});


DATABASE_HOST = /cloudsql/ 