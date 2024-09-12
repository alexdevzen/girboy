const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const { conectarDB } = require('./db');

// Ruta: POST /api/auth/register
router.post('/register', [
    check('username', 'Username is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    try {
        const db = await conectarDB();
        const users = db.collection('users');

        let user = await users.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists', field: 'email' });
        }

        user = await users.findOne({ username });
        if (user) {
            return res.status(400).json({ msg: 'Username already taken', field: 'username' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = {
            username,
            email,
            password: hashedPassword,
            isApproved: false,
            isAdmin: false
        };

        const result = await users.insertOne(newUser);

        const payload = {
            user: {
                id: result.insertedId.toString()
            }
        };

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
        res.status(201).json({ msg: 'User registered successfully. Pending approval.' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// Ruta: POST /api/auth/login
router.post('/login', [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        const db = await conectarDB();
        const users = db.collection('users');

        let user = await users.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const payload = {
            user: {
                id: user._id.toString()
            }
        };
        if (!user.isApproved) {
            return res.status(403).json({ msg: 'Your account is pending approval' });
        }

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});



// Ruta para crear un administrador
router.post('/create-admin', [
    check('username', 'Username is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    check('secretCode', 'Secret code is required').not().isEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, secretCode } = req.body;

    // Verifica el código secreto
    if (secretCode !== process.env.ADMIN_SECRET_CODE) {
        return res.status(400).json({ msg: 'Invalid secret code' });
    }

    try {
        const db = await conectarDB();
        const users = db.collection('users');

        let user = await users.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = {
            username,
            email,
            password: hashedPassword,
            isApproved: true,
            isAdmin: true
        };

        const result = await users.insertOne(newUser);

        const payload = {
            user: {
                id: result.insertedId.toString()
            }
        };

        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }, (err, token) => {
            if (err) throw err;
            res.json({ token });
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});


module.exports = router;