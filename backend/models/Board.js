const mongoose = require('mongoose');

const boardSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // New, optional: set when a board is created under a Project. Existing
    // boards are unaffected (null) and every existing query keyed on `team`
    // still works exactly as before.
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Board', boardSchema);
