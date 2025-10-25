import mongoose from 'mongoose';

const dailyReportSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  workCompleted: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  workPlanned: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  blockers: {
    type: String,
    trim: true,
    maxlength: 500
  },
  hoursWorked: {
    type: Number,
    required: true,
    min: 0,
    max: 24
  },
  taskUpdates: [{
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    },
    progress: String,
    status: String
  }]
}, {
  timestamps: true
});

// Ensure one report per user per day per project
dailyReportSchema.index({ projectId: 1, userId: 1, reportDate: 1 }, { unique: true });

const DailyReport = mongoose.model('DailyReport', dailyReportSchema);
export default DailyReport;