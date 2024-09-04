const express = require('express');
const { ObjectId } = require('mongodb');
const path = require('path');
const { conectarDB } = require('./db');
const Excel = require('exceljs');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Configuración de middleware
app.use(express.static(path.join(__dirname, '..')));
app.use(express.json());

/**
 * Obtiene todas las ciudades únicas
 */
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

/**
 * Rutas para clientes
 */
app.get('/api/clientes', async (req, res) => {
    try {
        const db = await conectarDB();
        const clientes = db.collection('clientes');
        let query = req.query.ciudad ? { ciudad: req.query.ciudad } : {};
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
        
        // Solo actualizamos los campos proporcionados
        const updateData = {};
        if (req.body.viatico !== undefined) updateData.viatico = req.body.viatico;
        if (req.body.estacionamiento !== undefined) updateData.estacionamiento = req.body.estacionamiento;

        const resultado = await clientes.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
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

/**
 * Rutas para trabajos
 */
app.get('/api/trabajos', async (req, res) => {
    try {
        const db = await conectarDB();
        const trabajos = db.collection('trabajos');
        const clientes = db.collection('clientes');

        const { anio, mes } = req.query;
        let query = {};

        if (anio && mes) {
            const primerDiaMes = new Date(anio, mes - 1, 1);
            const ultimoDiaMes = new Date(anio, mes, 0);
            query.fecha = {
                $gte: primerDiaMes.toISOString().split('T')[0],
                $lte: ultimoDiaMes.toISOString().split('T')[0]
            };
        }

        const resultado = await trabajos.find(query).toArray();

        // Agregar información del cliente
        const trabajosConCliente = await Promise.all(resultado.map(async (trabajo) => {
            const cliente = await clientes.findOne({ codigo: trabajo.codigoCliente });
            return {
                ...trabajo,
                ciudad: cliente ? cliente.ciudad : 'N/A'
            };
        }));

        res.json(trabajosConCliente);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

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
            estacionamiento: req.body.estacionamiento,
            ...(req.body.codigo && { codigo: req.body.codigo })
        };

        const resultado = await trabajos.insertOne(nuevoTrabajo);
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/trabajos/:id', async (req, res) => {
    try {
        const db = await conectarDB();
        const trabajos = db.collection('trabajos');
        const id = req.params.id;
        const resultado = await trabajos.deleteOne({ _id: new ObjectId(id) });
        res.json(resultado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Ruta para obtener ganancias
 */
app.get('/api/ganancias', async (req, res) => {
    try {
        const db = await conectarDB();
        const trabajos = db.collection('trabajos');
        const año = parseInt(req.query.año) || new Date().getFullYear();

        const resultado = await trabajos.aggregate([
            {
                $match: {
                    fecha: {
                        $gte: `${año}-01-01`,
                        $lte: `${año}-12-31`
                    }
                }
            },
            {
                $group: {
                    _id: { $substr: ['$fecha', 5, 2] },
                    ganancias: { $sum: '$valor' }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]).toArray();

        const gananciasmensuales = Array(12).fill(0);
        resultado.forEach(item => {
            const mes = parseInt(item._id) - 1;
            gananciasmensuales[mes] = item.ganancias;
        });

        res.json(gananciasmensuales);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * Endpoint para generar Excel
 */
app.get('/api/trabajos/excel', async (req, res) => {
    try {
        const { anio, mes } = req.query;
        const db = await conectarDB();
        const trabajos = db.collection('trabajos');
        const clientes = db.collection('clientes');

        const primerDiaMes = new Date(anio, mes - 1, 1);
        const ultimoDiaMes = new Date(anio, mes, 0);

        const query = {
            fecha: {
                $gte: primerDiaMes.toISOString().split('T')[0],
                $lte: ultimoDiaMes.toISOString().split('T')[0]
            }
        };

        const resultado = await trabajos.find(query).toArray();

        const workbook = new Excel.Workbook();
        const worksheet = workbook.addWorksheet('Trabajos');

        worksheet.columns = [
            { header: 'Fecha', key: 'fecha', width: 15 },
            { header: 'Código', key: 'codigo', width: 15 },
            { header: 'Tipo', key: 'tipo', width: 15 },
            { header: 'Cliente', key: 'codigoCliente', width: 15 },
            { header: 'Ciudad', key: 'ciudad', width: 15 },
            { header: 'Valor', key: 'valor', width: 15 },
            { header: 'Viático', key: 'viatico', width: 15 },
            { header: 'Estacionamiento', key: 'estacionamiento', width: 15 },
            { header: 'Descripción', key: 'descripcion', width: 30 }
        ];

        for (const trabajo of resultado) {
            const cliente = await clientes.findOne({ codigo: trabajo.codigoCliente });
            worksheet.addRow({
                ...trabajo,
                ciudad: cliente ? cliente.ciudad : 'N/A'
            });
        }

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=trabajos-${anio}-${mes}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Error al generar Excel:', error);
        res.status(500).json({ error: error.message });
    }
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Ocurrió un error en el servidor' });
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});