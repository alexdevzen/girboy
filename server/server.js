const express = require('express');
const { ObjectId } = require('mongodb');
const path = require('path');
const { conectarDB } = require('./db');  // Importamos la función conectarDB
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, '..')));
app.use(express.json());


// Ruta para obtener todas las ciudades únicas
app.get('/api/ciudades', async (req, res) => {
    try {
        const db = await conectarDB();
        const clientes = db.collection('clientes');
        const ciudades = await clientes.distinct('ciudad');
        res.json(ciudades);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



// Rutas para clientes
app.get('/api/clientes', async (req, res) => {
    try {
        const db = await conectarDB();
        const clientes = db.collection('clientes');
        let query = {};
        if (req.query.ciudad) {
            query.ciudad = req.query.ciudad;
        }
        const resultado = await clientes.find(query).toArray();
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

app.get('/api/clientes/:id', async (req, res) => {
    try {
        const db = await conectarDB();
        const clientes = db.collection('clientes');
        const id = req.params.id;
        const resultado = await clientes.findOne({ _id: new ObjectId(id) });
        if (!resultado) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }
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

// Actualiza la ruta POST de trabajos
app.post('/api/trabajos', async (req, res) => {
    try {
        const db = await conectarDB();
        const trabajos = db.collection('trabajos');
        const clientes = db.collection('clientes');

        const clienteExistente = await clientes.findOne({ codigo: req.body.codigoCliente });
        if (!clienteExistente) {
            return res.status(400).json({ error: 'El código de cliente no existe' });
        }

        const nuevoTrabajo = {
            fecha: req.body.fecha,
            tipo: req.body.tipo,
            codigoCliente: req.body.codigoCliente,
            descripcion: req.body.descripcion,
            valor: req.body.valor,
            viatico: req.body.viatico,
            estacionamiento: req.body.estacionamiento, // Aseguramos que se incluya el campo de estacionamiento
            ...(req.body.codigo && { codigo: req.body.codigo })
        };

        const resultado = await trabajos.insertOne(nuevoTrabajo);
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//middleware de manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Ocurrió un error en el servidor' });
});

app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});