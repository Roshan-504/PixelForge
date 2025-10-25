import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [4, 'Password must be at least 4 characters'],
  },
  role: {
    type: String,
    enum: ['admin', 'lead', 'developer'],
    default: 'developer'
  },
  projects: [{
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project'
    },
    roleInProject: {
      type: String,
      enum: ['lead', 'member']
    }
  }],
  mfaSecret: {
    type: String,
    select: false
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ 'projects.projectId': 1 });


const User = mongoose.model('User', userSchema);

export default User;