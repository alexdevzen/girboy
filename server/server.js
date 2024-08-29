const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '..')));
app.use(express.json());

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function conectarDB() {
    try {
        await client.connect();
        console.log('Conectado a MongoDB');
    } catch (error) {
        console.error('Error conectando a MongoDB:', error);
    }
}

conectarDB();

// Rutas para clientes
app.get('/api/clientes', async (req, res) => {
    try {
        const database = client.db('tu_base_de_datos');
        const clientes = database.collection('clientes');
        const resultado = await clientes.find({}).toArray();
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/clientes', async (req, res) => {
    try {
        const database = client.db('tu_base_de_datos');
        const clientes = database.collection('clientes');
        const resultado = await clientes.insertOne(req.body);
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Rutas para trabajos
app.get('/api/trabajos', async (req, res) => {
    try {
        const database = client.db('tu_base_de_datos');
        const trabajos = database.collection('trabajos');
        const resultado = await trabajos.find({}).toArray();
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/trabajos', async (req, res) => {
    try {
        const database = client.db('tu_base_de_datos');
        const trabajos = database.collection('trabajos');
        const resultado = await trabajos.insertOne(req.body);
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Eliminar clientes
app.delete('/api/clientes/:id', async (req, res) => {
    try {
        const database = client.db('tu_base_de_datos');
        const clientes = database.collection('clientes');
        const id = req.params.id;
        const resultado = await clientes.deleteOne({ _id: new ObjectId(id) });
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});