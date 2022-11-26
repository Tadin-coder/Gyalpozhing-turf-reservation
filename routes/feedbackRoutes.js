const express = require('express');
const router = express.Router();
const Feedback = require('../models/feedbackModels');

router.get('/contact-us', function (req, res) {
  res.render('feedbackForm');
});

router.post('/contact', function (req, res) {
  const newFeedback = new Feedback({
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    subject: req.body.subject,
    details: req.body.details,
  });
  newFeedback.save(function (err) {
    if (err) {
      console.log(err);
    } else {
      res.render('home');
    }
  });
});

router.get('/feedbackList', function (req, res) {
  Feedback.find({}, function (err, Feedbacks) {
    if (err) {
      console.log(err);
    } else {
      res.render('adminFeedback', { Feedbacks: Feedbacks });
    }
  });
});

router.get('/deleteFeed/:id', async function (req, res) {
  await Feedback.findByIdAndDelete(req.params.id);
  res.redirect('/feedbackList');
});

module.exports = router;
