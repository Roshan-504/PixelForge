import express from 'express';
import Project from '../models/Project.js';
import { authenticate, authorizeRoles } from '../middlewares/auth.js';
import DailyReport from '../models/Report.js';

const router = express.Router();

// Submit daily report
router.post('/projects/:projectId/daily-reports', authenticate, async (req, res) => {
  try {
    const { workCompleted, workPlanned, blockers, hoursWorked, taskUpdates } = req.body;

    // Verify project exists and user is team member
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user is part of project team
    const isTeamMember = project.team.some(member => 
      member.userId.toString() === req.user._id.toString()
    );
    const isLead = project.lead.toString() === req.user._id.toString();
    
    if (!isTeamMember && !isLead) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to submit reports for this project'
      });
    }

    // Set report date to today (start of day for uniqueness check)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const report = new DailyReport({
      projectId: req.params.projectId,
      userId: req.user._id,
      reportDate: today,
      workCompleted,
      workPlanned,
      blockers,
      hoursWorked,
      taskUpdates
    });

    await report.save();
    await report.populate('userId', 'name email');

    res.status(201).json({
      success: true,
      data: report
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a report for today'
      });
    }
    res.status(400).json({
      success: false,
      message: 'Failed to submit daily report'
    });
  }
});

// Get daily reports for a project (leads/admins can see all, developers see only their own)
router.get('/projects/:projectId/daily-reports', authenticate, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    const isLead = project.lead.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    const isTeamMember = project.team.some(member => 
      member.userId.toString() === req.user._id.toString()
    );

    let query = { projectId: req.params.projectId };
    
    // Developers can only see their own reports
    if (!isLead && !isAdmin) {
      query.userId = req.user._id;
    }

    const reports = await DailyReport.find(query)
      .populate('userId', 'name email')
      .sort({ reportDate: -1 });

    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch daily reports'
    });
  }
});

// Get today's report for current user
router.get('/projects/:projectId/daily-reports/today', authenticate, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const report = await DailyReport.findOne({
      projectId: req.params.projectId,
      userId: req.user._id,
      reportDate: today
    }).populate('userId', 'name email');

    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch today\'s report'
    });
  }
});

export default router;