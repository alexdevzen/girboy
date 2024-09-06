const { MongoClient } = require('mongodb');
require('dotenv').config();

// URI de conexión a MongoDB, obtenida de las variables de entorno
const uri = process.env.MONGODB_URI;

// Opciones de conexión para el cliente de MongoDB
const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    // Añadir más opciones según sea necesario
};

// Instancia del cliente MongoDB
const client = new MongoClient(uri, options);

// Variable para almacenar la conexión a la base de datos
let database;

/**
 * Conecta a la base de datos MongoDB
 * @returns {Promise<Db>} Instancia de la base de datos conectada
 */
async function conectarDB() {
    if (database) return database;

    try {
        await client.connect();
        console.log('Conectado a MongoDB');

        database = client.db(process.env.DB_NAME || 'tu_base_de_datos');
        return database;
    } catch (error) {
        console.error('Error conectando a MongoDB:', error);
        process.exit(1);
    }
}

module.exports = { conectarDB };