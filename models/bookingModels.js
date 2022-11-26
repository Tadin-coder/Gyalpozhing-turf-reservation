const mongoose = require('mongoose');

const BookingSchema = new mongoose.Schema(
  {
    id: {
      type: String,
    },
    name: {
      type: String,
    },

    username: {
      type: String,
    },

    phone: {
      type: String,
    },

    date: {
      type: String,
    },

    time: {
      type: String,
    },

    day: {
      type: String,
    },

    isConfirm: {
      type: String,
      role: { type: String, default: 'Pending' },
    },

    jrnlNo: {
      type: Number,
    },
  },
  { timestamps: true }
);

module.exports = new mongoose.model('Booking', BookingSchema);
