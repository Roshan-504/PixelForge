import express from 'express';
import Task from '../models/Task.js';
import Project from '../models/Project.js';
import { authenticate, authorizeRoles } from '../middlewares/auth.js';

const router = express.Router();

// Get all tasks for a project
router.get('/projects/:projectId/tasks', authenticate, async (req, res) => {
  try {
    const tasks = await Task.find({ projectId: req.params.projectId })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: tasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks'
    });
  }
});

// Create new task
router.post('/projects/:projectId/tasks', authenticate, async (req, res) => {
  try {
    const { title, description, assignedTo, priority, dueDate } = req.body;

    // Verify project exists and user is lead/admin
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found'
      });
    }

    // Check if user is project lead or admin
    const isLead = project.lead.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isLead && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Only project leads and admins can create tasks'
      });
    }

    const task = new Task({
      title,
      description,
      assignedTo,
      priority,
      dueDate,
      projectId: req.params.projectId,
      createdBy: req.user._id
    });

    await task.save();
    await task.populate('assignedTo', 'name email');

    res.status(201).json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to create task'
    });
  }
});

// Update task status
router.patch('/projects/:projectId/tasks/:taskId/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;

    const task = await Task.findOneAndUpdate(
      { _id: req.params.taskId, projectId: req.params.projectId },
      { status },
      { new: true }
    ).populate('assignedTo', 'name email');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to update task'
    });
  }
});

// Delete task
router.delete('/projects/:projectId/tasks/:taskId', authenticate, async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.taskId,
      projectId: req.params.projectId
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Failed to delete task'
    });
  }
});

export default router;