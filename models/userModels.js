const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');

// const UserSchema = new mongoose.Schema(
//   {
//     name: {
//       type: String,
//       required: true,
//     },

//     email: {
//       type: String,
//       required: true,
//       unique: true,
//     },

//     emailToken: {
//       type: String,
//     },

//     phone: {
//       type: String,
//       required: true,
//     },

//     password: {
//       type: String,
//       required: true,
//     },

//     isVerified: {
//       type: Boolean,
//     },

//     isAdmin: {
//       type: Boolean,
//       default: false,
//     },
//   },
//   { timestamps: true }
// );

// module.exports = new mongoose.model('User', UserSchema);

const UserSchema = new mongoose.Schema(
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
      default: false,
    },

    img: {
      data: Buffer,
      contentType: String,
    },
  },
  { timestamps: true }
);

UserSchema.plugin(passportLocalMongoose);
module.exports = new mongoose.model('User', UserSchema);
