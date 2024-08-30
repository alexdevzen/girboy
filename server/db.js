const { MongoClient } = require('mongodb');
require('dotenv').config();

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

let database;

async function conectarDB() {
    if (database) return database;
    try {
        await client.connect();
        console.log('Conectado a MongoDB');
        database = client.db('tu_base_de_datos');
        return database;
    } catch (error) {
        console.error('Error conectando a MongoDB:', error);
        process.exit(1);
    }
}

module.exports = { conectarDB };