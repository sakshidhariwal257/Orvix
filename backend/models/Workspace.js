const mongoose = require('mongoose');

// Roles used across Workspace membership (and reused by Team Management in a
// later phase) - Owner has full control, Guest is the most restricted.
const WORKSPACE_ROLES = ['Owner', 'Admin', 'Manager', 'Member', 'Guest'];

const workspaceMemberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    role: { type: String, enum: WORKSPACE_ROLES, default: 'Member' },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const workspaceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    type: {
      type: String,
      enum: ['Personal', 'Team', 'Organization'],
      required: true,
      default: 'Team',
    },
    color: { type: String, default: '#7c5cff' },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [workspaceMemberSchema],
    settings: {
      allowGuestAccess: { type: Boolean, default: true },
      defaultBoardView: { type: String, default: 'Board' },
    },
    // Billing is a placeholder until a real payment provider (e.g. Stripe) is
    // wired in - no charges are processed, this just tracks a plan label.
    billing: {
      plan: { type: String, enum: ['Free', 'Pro', 'Enterprise'], default: 'Free' },
      status: { type: String, default: 'active' },
    },
    archived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Workspace', workspaceSchema);
module.exports.WORKSPACE_ROLES = WORKSPACE_ROLES;
