const mongoose = require('mongoose');

const resumeSectionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['name', 'title', 'summary', 'skills', 'experience', 'projects', 'education'],
    required: true
  },
  content: {
    type: String,
    default: ''
  },
  modifiedByAI: {
    type: Boolean,
    default: false
  }
});

const resumeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  sections: [resumeSectionSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt field before saving
resumeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Resume', resumeSchema);