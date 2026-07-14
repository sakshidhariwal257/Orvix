const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    coverImage: { type: String, default: '' }, // stored as a URL, same pattern as User.avatar
    status: {
      type: String,
      enum: ['Planning', 'Active', 'On Hold', 'Completed', 'Archived'],
      default: 'Planning',
    },
    // Mirrors Task.priority's enum for consistency across the app
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    dueDate: { type: Date, default: null },
    labels: [{ type: String }],
    tags: [{ type: String }],
    visibility: {
      type: String,
      enum: ['Private', 'Team', 'Workspace'],
      default: 'Team',
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Every project belongs to a team (existing Team model, untouched) and,
    // when that team belongs to a workspace, the workspace too - denormalized
    // here so project queries don't need an extra hop through Team.
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
    },
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      default: null,
    },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);
