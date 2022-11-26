const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

const AdminSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    username: {
      type: String,
      required: true,
      unique: true,
    },

    emailToken: {
      type: String,
    },

    phone: {
      type: String,
      required: true,
    },

    password: {
      type: String,
    },

    isVerified: {
      type: Boolean,
    },

    isAdmin: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

AdminSchema.plugin(passportLocalMongoose);
module.exports = new mongoose.model('Admin', AdminSchema);
