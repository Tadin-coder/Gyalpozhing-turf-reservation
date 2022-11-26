const express = require('express');
const router = express.Router();
const Booking = require('../models/bookingModels');

router.get('/schedule', function (req, res) {
  Booking.find({}, function (err, foundRecord) {
    if (err) {
      console.log(err);
    } else {
      res.render('schedule', { foundRecord: foundRecord });
    }
  });
});

module.exports = router;
