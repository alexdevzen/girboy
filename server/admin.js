const express = require('express');
const router = express.Router();
const { conectarDB } = require('./db');
const { ObjectId } = require('mongodb');
const authMiddleware = require('./authMiddleware');

// Middleware para verificar si el usuario es administrador
async function isAdmin(req, res, next) {
    try {
        const db = await conectarDB();
        const users = db.collection('users');
        const user = await users.findOne({ _id: new ObjectId(req.user.id) });

        if (!user || !user.isAdmin) {
            return res.status(403).json({ msg: 'Access denied. Admin privileges required.' });
        }
        next();
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
}

// Ruta para obtener usuarios pendientes de aprobación
router.get('/pending-users', authMiddleware, isAdmin, async (req, res) => {
    try {
        const db = await conectarDB();
        const users = db.collection('users');
        const pendingUsers = await users.find({ isApproved: false }).project({ password: 0 }).toArray();
        res.json(pendingUsers);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Ruta para aprobar un usuario
router.put('/approve-user/:id', authMiddleware, isAdmin, async (req, res) => {
    try {
        const db = await conectarDB();
        const users = db.collection('users');
        const result = await users.updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: { isApproved: true } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json({ msg: 'User approved successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// Ruta para rechazar un usuario
router.delete('/reject-user/:id', authMiddleware, isAdmin, async (req, res) => {
    try {
        const db = await conectarDB();
        const users = db.collection('users');
        const result = await users.deleteOne({ _id: new ObjectId(req.params.id) });

        if (result.deletedCount === 0) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json({ msg: 'User rejected and removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;