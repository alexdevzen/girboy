const { MongoClient } = require('mongodb');
require('dotenv').config();

// URI de conexión a MongoDB, obtenida de las variables de entorno
const uri = process.env.MONGODB_URI;

// Opciones de conexión para el cliente de MongoDB
const options = { useNewUrlParser: true, useUnifiedTopology: true };

// Instancia del cliente MongoDB
const client = new MongoClient(uri, options);

// Variable para almacenar la conexión a la base de datos
let database;

/**
 * Conecta a la base de datos MongoDB
 * @returns {Promise<Db>} Instancia de la base de datos conectada
 */
async function conectarDB() {
    // Si ya existe una conexión, la retornamos
    if (database) return database;

    try {
        // Intentamos establecer la conexión
        await client.connect();
        console.log('Conectado a MongoDB');

        // Obtenemos la instancia de la base de datos
        database = client.db('tu_base_de_datos');
        return database;
    } catch (error) {
        console.error('Error conectando a MongoDB:', error);
        // En caso de error, terminamos el proceso
        process.exit(1);
    }
}

module.exports = { conectarDB };