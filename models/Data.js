const mongoose = require('mongoose');

const dataSchema = new mongoose.Schema({
  unique_id: {
    type: Number,
    required: true,
    unique: true
  },
  first_name: {
    type: String,
    required: true
  },
  middle_name: {
    type: String,
    default: null
  },
  surname: {
    type: String,
    required: true
  },
  village: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  pincode: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  },
  phone_no1: {
    type: String,
    required: true
  },
  phone_no2: {
    type: String,
    default: null
  }
}, { timestamps: true });

module.exports = mongoose.model('Data', dataSchema);
