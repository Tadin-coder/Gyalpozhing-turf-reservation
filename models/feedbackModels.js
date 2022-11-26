const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },

    email: {
      type: String,
    },

    phone: {
      type: String,
    },
    subject: {
      type: String,
    },
    details: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = new mongoose.model('Feedback', FeedbackSchema);
