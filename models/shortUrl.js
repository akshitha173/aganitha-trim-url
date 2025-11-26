const mongoose = require('mongoose')
const shortId = require('shortid')

const shortUrlSchema = new mongoose.Schema({
  full: {
    type: String,
    required: true
  },
  short: {
    type: String,
    required: true,
    default: shortId.generate,
    unique: true,
    index: true
  },
  clicks: {
    type: Number,
    required: true,
    default: 0
  },
  lastClicked: {
    type: Date,
    default: null
  }
}, { timestamps: true })

// Ensure `full` has a protocol so redirects work reliably
shortUrlSchema.pre('validate', function (next) {
  if (this.full && !/^https?:\/\//i.test(this.full)) {
    this.full = 'http://' + this.full
  }
  next()
})

// Virtual that returns an absolute short URL if BASE_URL is provided
shortUrlSchema.virtual('shortUrl').get(function () {
  const base = process.env.BASE_URL || ''
  if (!base) return '/' + this.short
  return base.replace(/\/$/, '') + '/' + this.short
})

shortUrlSchema.set('toJSON', { virtuals: true })
shortUrlSchema.set('toObject', { virtuals: true })

module.exports = mongoose.model('ShortUrl', shortUrlSchema)