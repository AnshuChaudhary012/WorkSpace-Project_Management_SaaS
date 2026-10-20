const mongoose = require('mongoose');

const membershipSchema = new mongoose.Schema(
  {
    workspace: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member'],
      default: 'member',
      required: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Compound index to guarantee one membership per user per workspace
membershipSchema.index({ workspace: 1, user: 1 }, { unique: true });

const Membership = mongoose.model('Membership', membershipSchema);

module.exports = Membership;
