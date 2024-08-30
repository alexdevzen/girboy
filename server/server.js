const express = require('express');
const { ObjectId } = require('mongodb');
const path = require('path');
const { conectarDB } = require('./db');  // Importamos la función conectarDB
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '..')));
app.use(express.json());



// Rutas para clientes
app.get('/api/clientes', async (req, res) => {
    try {
        const db = await conectarDB();
        const clientes = db.collection('clientes');
        const resultado = await clientes.find({}).toArray();
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/clientes/:id', async (req, res) => {
    try {
        const db = await conectarDB();
        const clientes = db.collection('clientes');
        const id = req.params.id;
        const resultado = await clientes.findOne({ _id: new ObjectId(id) });
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/clientes', async (req, res) => {
    try {
        const db = await conectarDB();
        const clientes = db.collection('clientes');
        const resultado = await clientes.insertOne(req.body);
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put('/api/clientes/:id', async (req, res) => {
    try {
        const db = await conectarDB();
        const clientes = db.collection('clientes');
        const id = req.params.id;
        const resultado = await clientes.updateOne(
            { _id: new ObjectId(id) },
            { $set: req.body }
        );
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/clientes/:id', async (req, res) => {
    try {
        const db = await conectarDB();
        const clientes = db.collection('clientes');
        const id = req.params.id;
        const resultado = await clientes.deleteOne({ _id: new ObjectId(id) });
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Rutas para trabajos
app.get('/api/trabajos', async (req, res) => {
    try {
        const db = await conectarDB();
        const trabajos = db.collection('trabajos');
        const resultado = await trabajos.find({}).toArray();
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/trabajos', async (req, res) => {
    try {
        const db = await conectarDB();
        const trabajos = db.collection('trabajos');
        const resultado = await trabajos.insertOne(req.body);
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});