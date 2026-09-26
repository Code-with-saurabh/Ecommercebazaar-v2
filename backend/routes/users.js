const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');   
const User = require('../models/User');
 
router.post('/register', async (req, res) => {
    try {
        const { username, email, phone, password } = req.body;

        // Check user already exists
        const existingUser = await User.findOne({
            $or: [{ username }, { email }, { phone }],
        });

        if (existingUser) {
            return res.status(400).json({ message: 'Duplicate data' });
        }

        // Hash the password before saving
        const salt = await bcrypt.genSalt(10);  // Generate salt
        const hashedPassword = await bcrypt.hash(password, salt);  // Hash the password

        
        const newUser = new User({
            username,
            email,
            phone,
            password: hashedPassword,
        });

         
        await newUser.save();

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        console.error('Error registering user:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST route to login a user
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }

        // Compare the provided password with the stored hashed password
        const isMatch = await bcrypt.compare(password, user.password); // Compare the plain text password with the hash

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid username or password' });
        }

         
        res.status(200).json({ message: 'Login successful' });

    } catch (err) {
        console.error('Error logging in user:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
