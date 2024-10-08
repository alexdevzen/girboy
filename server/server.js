const express = require('express');
const { ObjectId } = require('mongodb');
const path = require('path');
const { conectarDB } = require('./db');
const Excel = require('exceljs');
const authRoutes = require('./auth');
const authMiddleware = require('./authMiddleware');
const adminRoutes = require('./admin');
require('dotenv').config();


const app = express();
const port = process.env.PORT || 3000;

// Configuración de middleware
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);


// Función de utilidad para manejar errores
const handleError = (res, error) => {
    console.error('Error:', error);
    res.status(500).json({ error: error.message || 'Error interno del servidor' });
};


// Ruta protegida para admin.html
app.get('/admin', authMiddleware, async (req, res) => {
    try {
        const db = await conectarDB();
        const users = db.collection('users');
        const user = await users.findOne({ _id: new ObjectId(req.user.id) });

        if (!user || !user.isAdmin) {
            return res.status(403).sendFile(path.join(__dirname, '../public', 'unauthorized.html'));
        }

        res.sendFile(path.join(__dirname, '../public', 'admin.html'));
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * Obtiene todas las ciudades únicas
 */
app.get('/api/ciudades', authMiddleware, async (req, res) => {
    try {
        const db = await conectarDB();
        const clientes = db.collection('clientes');
        const ciudades = await clientes.distinct('ciudad');
        res.json(ciudades);
    } catch (error) {
        handleError(res, error);
    }
});

/**
 * Rutas para clientes
 */
app.get('/api/clientes', authMiddleware, async (req, res) => {
    try {
        const db = await conectarDB();
        const clientes = db.collection('clientes');
        const query = req.query.ciudad ? { ciudad: req.query.ciudad } : {};
        const resultado = await clientes.find(query).toArray();
        res.json(resultado);
    } catch (error) {
        handleError(res, error);
    }
});

app.post('/api/clientes', authMiddleware, async (req, res) => {
    try {
        const db = await conectarDB();
        const clientes = db.collection('clientes');
        const resultado = await clientes.insertOne(req.body);
        res.status(201).json(resultado);
    } catch (error) {
        handleError(res, error);
    }
});

app.put('/api/clientes/:id', authMiddleware, async (req, res) => {
    try {
        const db = await conectarDB();
        const clientes = db.collection('clientes');
        const id = req.params.id;

        const updateData = {};
        if (req.body.viatico !== undefined) updateData.viatico = req.body.viatico;
        if (req.body.estacionamiento !== undefined) updateData.estacionamiento = req.body.estacionamiento;

        const resultado = await clientes.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        if (resultado.matchedCount === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }
        res.json(resultado);
    } catch (error) {
        handleError(res, error);
    }
});

app.delete('/api/clientes/:id', authMiddleware, async (req, res) => {
    try {
        const db = await conectarDB();
        const clientes = db.collection('clientes');
        const id = req.params.id;
        const resultado = await clientes.deleteOne({ _id: new ObjectId(id) });

        if (resultado.deletedCount === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }
        res.json(resultado);
    } catch (error) {
        handleError(res, error);
    }
});

app.get('/api/clientes/:id', authMiddleware, async (req, res) => {
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
        handleError(res, error);
    }
});

/**
 * Rutas para trabajos
 */
app.get('/api/trabajos', authMiddleware, async (req, res) => {
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
        handleError(res, error);
    }
});

app.post('/api/trabajos', authMiddleware, async (req, res) => {
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
        res.status(201).json(resultado);
    } catch (error) {
        handleError(res, error);
    }
});

app.delete('/api/trabajos/:id', authMiddleware, async (req, res) => {
    try {
        const db = await conectarDB();
        const trabajos = db.collection('trabajos');
        const id = req.params.id;
        const resultado = await trabajos.deleteOne({ _id: new ObjectId(id) });

        if (resultado.deletedCount === 0) {
            return res.status(404).json({ error: 'Trabajo no encontrado' });
        }
        res.json(resultado);
    } catch (error) {
        handleError(res, error);
    }
});

/**
 * Ruta para obtener ganancias
 */
app.get('/api/ganancias', authMiddleware, async (req, res) => {
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
        handleError(res, error);
    }
});

/**
 * Endpoint para generar Excel
 */
app.get('/api/trabajos/excel', authMiddleware, async (req, res) => {
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

app.get('/api/trabajos/excel-boleta', authMiddleware, async (req, res) => {
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
        const worksheet = workbook.addWorksheet('Boletas');

        worksheet.columns = [
            { header: 'Fecha', key: 'fecha', width: 15 },
            { header: 'Código', key: 'codigo', width: 15 },
            { header: 'Ciudad', key: 'ciudad', width: 20 },
            { header: 'Tipo', key: 'tipo', width: 15 },
            { header: 'Valor', key: 'valor', width: 15 },
            { header: 'Viáticos y Estacionamiento', key: 'viaticosYEstacionamiento', width: 25 }
        ];

        let totalViaticosYEstacionamiento = 0;

        for (const trabajo of resultado) {
            const cliente = await clientes.findOne({ codigo: trabajo.codigoCliente });
            const [anio, mes, dia] = trabajo.fecha.split('-');
            const fechaFormateada = `${dia}/${mes}`; // Formato corregido: día/mes
            const esMantenimieto = trabajo.tipo.toUpperCase() === 'MANTENIMIENTO';

            const valorBruto = trabajo.valor;
            const valorConImpuesto = valorBruto / 0.8625; // Aplicar la retención del 13.75%

            worksheet.addRow({
                fecha: fechaFormateada,
                codigo: trabajo.codigoCliente.toUpperCase(),
                ciudad: cliente.ciudad.toUpperCase(),
                tipo: esMantenimieto ? 'M' : '',
                valor: valorConImpuesto,
                viaticosYEstacionamiento: ''
            });

            totalViaticosYEstacionamiento += trabajo.viatico + trabajo.estacionamiento;
        }

        // Agregar fila para viáticos y estacionamiento
        const totalViaticosYEstacionamientoConImpuesto = totalViaticosYEstacionamiento / 0.8625;
        worksheet.addRow({
            fecha: '',
            codigo: 'VIATICOS Y ESTACIONAMIENTO',
            ciudad: '',
            tipo: '',
            valor: '',
            viaticosYEstacionamiento: totalViaticosYEstacionamientoConImpuesto
        });

        // Formatear celdas
        worksheet.getColumn('valor').numFmt = '#,##0';
        worksheet.getColumn('viaticosYEstacionamiento').numFmt = '#,##0';

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=boletas-${anio}-${mes}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error('Error al generar Excel de boletas:', error);
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