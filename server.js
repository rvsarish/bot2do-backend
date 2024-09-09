const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Data = require('./models/Data');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json()); // Using express.json() instead of body-parser

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb+srv://user1:user123@dashboard.wupgl.mongodb.net/?retryWrites=true&w=majority&appName=Dashboard');
    console.log('MongoDB connected');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    process.exit(1);
  }
};

connectDB();

// API Routes
app.post('/api/users', async (req, res) => {
  const { username, password, role } = req.body;
  try {
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = new User({ username, password: hashedPassword, role });
    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
app.get('/api/frequent-words', async (req, res) => {
  try {
    const uniqueIds = await Data.distinct('unique_id');
    const firstNames = await Data.distinct('first_name');
    const surnames = await Data.distinct('surname');
    const villages = await Data.distinct('village');
    const states = await Data.distinct('state');
    const countries = await Data.distinct('country');

    res.json({
      unique_id: uniqueIds,
      first_name: firstNames,
      surname: surnames,
      village: villages,
      state: states,
      country: countries,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { username, password, role } = req.body;
  try {
    const updateFields = { username, role };
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 12);
      updateFields.password = hashedPassword;
    }

    const user = await User.findByIdAndUpdate(id, updateFields, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
app.post('/api/datas/bulk-delete', async (req, res) => {
  const { ids } = req.body; // Array of IDs to be deleted
  try {
    await Data.deleteMany({ unique_id: { $in: ids } });
    res.status(200).json({ message: 'Items deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/datas', async (req, res) => {
  try {
    const data = new Data(req.body);
    await data.save();
    res.status(201).json(data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/datas/:unique_id', async (req, res) => {
  try {
    const data = await Data.findOne({ unique_id: req.params.unique_id });
    if (!data) return res.status(404).json({ message: 'Data not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/datas/:unique_id', async (req, res) => {
  try {
    const data = await Data.findOneAndUpdate({ unique_id: req.params.unique_id }, req.body, { new: true });
    if (!data) return res.status(404).json({ message: 'Data not found' });
    res.json(data);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.delete('/api/datas/:unique_id', async (req, res) => {
  try {
    const result = await Data.deleteOne({ unique_id: req.params.unique_id });
    if (result.deletedCount === 0) return res.status(404).json({ message: 'Data not found' });
    res.json({ message: 'Data deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/datas', async (req, res) => {
  const {
    page = 1,
    limit = 10,
    unique_id = '',
    first_name = '',
    surname = '',
    village = '',
    address = '',
    pincode = '',
    state = '',
    country = '',
    phone_no1 = '',
    phone_no2 = '',
  } = req.query;

  try {
    let query = {};

    if (unique_id) query.unique_id = unique_id;
    if (first_name) query.first_name = new RegExp(first_name, 'i');
    if (surname) query.surname = new RegExp(surname, 'i');
    if (village) query.village = new RegExp(village, 'i');
    if (address) query.address = new RegExp(address, 'i');
    if (pincode) query.pincode = new RegExp(pincode, 'i');
    if (state) query.state = new RegExp(state, 'i');
    if (country) query.country = new RegExp(country, 'i');
    if (phone_no1) query.phone_no1 = new RegExp(phone_no1, 'i');
    if (phone_no2) query.phone_no2 = new RegExp(phone_no2, 'i');

    const data = await Data.find(query)
      .sort({ unique_id: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Data.countDocuments(query);

    res.json({ data, total });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// New Endpoint for Unique Values
app.get('/api/datas/unique/:field', async (req, res) => {
  try {
    const field = req.params.field;
    const uniqueValues = await Data.distinct(field);
    res.json({ uniqueValues });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Search Endpoint in Popup
app.get('/api/datas/search/:field', async (req, res) => {
  try {
    const field = req.params.field;
    const { query } = req.query;
    const regex = new RegExp(query, 'i');
    const uniqueValues = await Data.distinct(field, { [field]: regex });
    res.json({ uniqueValues });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = 'some_generated_token'; // Replace with real token generation logic

    res.status(200).json({ token, role: user.role });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
