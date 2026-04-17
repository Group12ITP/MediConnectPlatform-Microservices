const mongoose = require('mongoose');
const { getIdentityConnection } = require('../../config/identityDb');

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 },
});

const conn = getIdentityConnection();

module.exports = conn.models.Counter || conn.model('Counter', counterSchema);
