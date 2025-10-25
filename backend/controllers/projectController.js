import Document from '../models/Document.js';
import Project from '../models/Project.js';
import User from '../models/User.js';

// @desc    Create a project
// @route   POST /api/projects
// @access  Private (Admin/Lead)
export const createProject = async (req, res) => {
  try {
    const { name, description, deadline, status, lead, team } = req.body;

    // Validate required fields
    if (!name || !description || !deadline || !lead) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide name, description, deadline, and lead'
      });
    }

    // Check if lead exists
    const leadUser = await User.findById(lead);
    if (!leadUser) {
      return res.status(400).json({
        status: 'fail',
        message: 'Lead user not found'
      });
    }

    // Check if team members exist
    if (team && team.length > 0) {
      const teamMembers = await User.find({ 
        _id: { $in: team.map(member => member.userId) } 
      });
      if (teamMembers.length !== team.length) {
        return res.status(400).json({
          status: 'fail',
          message: 'One or more team members not found'
        });
      }
    }

    // Create project
    const project = await Project.create({
      name,
      description,
      deadline,
      status: status || 'active',
      lead,
      team
    });

    // Populate lead and team for response
    const populatedProject = await Project.findById(project._id)
      .populate('lead', 'name email')
      .populate('team.userId', 'name email role');

    res.status(201).json({
      status: 'success',
      data: populatedProject
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to create project'
    });
  }
};

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
export const getProjects = async (req, res) => {
  try {
    let query = {};
    const { role, _id: userId } = req.user;

    // Filter projects based on user role
    if (role === 'developer') {
      query = {
        'team.userId': userId,
        status: 'active' // Only active projects
      };
    } else if (role === 'lead') {
      query = {
        $and: [
          { $or: [{ lead: userId }, { 'team.userId': userId }] },
          { status: 'active' } // Only active projects
        ]
      };
    }

    const projects = await Project.find(query)
    .populate('lead', 'name email')
    .populate('team.userId', 'name email role')
    .sort('-createdAt');

    // Get document counts for each project
    const projectsWithDocCount = await Promise.all(
    projects.map(async (proj) => {
        const docCount = await Document.countDocuments({ project: proj._id });
        return { ...proj.toObject(), documentCount: docCount };
    })
    );

    res.status(200).json({
    status: 'success',
    results: projectsWithDocCount.length,
    data: projectsWithDocCount,
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch projects'
    });
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
export const getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('lead', 'name email')
      .populate('team.userId', 'name email role');
    if (!project) {
      return res.status(404).json({
        status: 'fail',
        message: 'Project not found'
      });
    }

    // Check if user has access to this project
    const { role, _id: userId } = req.user;
    const isTeamMember = project.team.some(member => member.userId.equals(userId));
    
    if (role !== 'admin' && !project.lead.equals(userId) && !isTeamMember) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to view this project'
      });
    }

    res.status(200).json({
      status: 'success',
      data: project
    });
  } catch (err) {
    console.log(err)
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch project'
    });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Admin/Lead)
export const updateProject = async (req, res) => {
  try {
    const { name, description, deadline, status, lead, team } = req.body;
    const { role, _id: userId } = req.user;

    // Find existing project
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({
        status: 'fail',
        message: 'Project not found'
      });
    }

    // Check if user has permission to update
    if (role !== 'admin' && !project.lead.equals(userId)) {
      return res.status(403).json({
        status: 'fail',
        message: 'You do not have permission to update this project'
      });
    }

    // Update project fields
    project.name = name || project.name;
    project.description = description || project.description;
    project.deadline = deadline || project.deadline;
    project.status = status || project.status;
    
    // Only admin can change lead
    if (role === 'admin' && lead) {
      const newLead = await User.findById(lead);
      if (!newLead) {
        return res.status(400).json({
          status: 'fail',
          message: 'Lead user not found'
        });
      }
      project.lead = lead;
    }

    // Update team if provided
    if (team) {
      // Verify team members exist
      const teamMembers = await User.find({ 
        _id: { $in: team.map(member => member.userId) } 
      });
      if (teamMembers.length !== team.length) {
        return res.status(400).json({
          status: 'fail',
          message: 'One or more team members not found'
        });
      }
      project.team = team;
    }

    await project.save();

    // Get updated project with populated fields
    const updatedProject = await Project.findById(project._id)
      .populate('lead', 'name email')
      .populate('team.userId', 'name email role');

    res.status(200).json({
      status: 'success',
      data: updatedProject
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to update project'
    });
  }
};
// @desc    Delete project and its documents
// @route   DELETE /api/projects/:id
// @access  Private (Admin/Lead)
export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({
        status: 'fail',
        message: 'Project not found'
      });
    }

    // Delete all related documents first
    await Document.deleteMany({ project: req.params.id });

    // Delete the project
    await Project.findByIdAndDelete(req.params.id);

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete project'
    });
  }
};

// @desc    Get users available for project (leads and developers)
// @route   GET /api/projects/available-users
// @access  Private (Admin/Lead)
export const getAvailableUsers = async (req, res) => {
  try {
    const users = await User.find({ 
      role: { $in: ['lead', 'developer'] } 
    }).select('name email role');

    res.status(200).json({
      status: 'success',
      data: users
    });
  } catch (err) {
    console.error('Failed to fetch available users', err);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch available users'
    });
  }
};



// @desc    Get all documents for a project (without binary data)
// @route   GET /api/projects/:projectId/documents
// @access  Private (project members)
export const getProjectDocuments = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Verify project exists and user has access
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        status: 'fail',
        message: 'Project not found'
      });
    }


    const documents = await Document.find({ project: projectId })
      .select('-data') // Exclude binary data from list
      .populate('uploadedBy', 'name email')
      .sort('-createdAt');

    res.status(200).json({
      status: 'success',
      results: documents.length,
      data: documents
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch documents'
    });
  }
};

// @desc    Download a document
// @route   GET /api/projects/:projectId/documents/:docId/download
// @access  Private (project members)
// controllers/documentController.js
export const downloadDocument = async (req, res) => {
  try {
    const { projectId, docId } = req.params;
    
    const document = await Document.findById(docId);
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Set proper headers with encoded filename
    res.set({
      'Content-Type': document.contentType,
      'Content-Length': document.size,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(document.name)}`
    });

    res.send(document.data);
  } catch (err) {
    console.error('Download error:', err);
    res.status(500).json({ message: 'Download failed' });
  }
};

// controllers/documentController.js

// ... existing imports and functions ...

// @desc    Upload document link to project
// @route   POST /api/projects/:projectId/documents/link
// @access  Private (Admin/Lead)
export const uploadDocumentLink = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { _id: userId } = req.user;
    const { name, link } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        status: 'fail',
        message: 'Document name is required'
      });
    }

    if (!link || !link.trim()) {
      return res.status(400).json({
        status: 'fail',
        message: 'Document link is required'
      });
    }

    // Verify the URL is valid
    try {
      new URL(link);
    } catch (err) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid URL format'
      });
    }

    const document = await Document.create({
      project: projectId,
      name: name.trim(),
      link,
      uploadedBy: userId,
    });

    const populatedDoc = await Document.findById(document._id)
      .select('-data') // Exclude binary data from response
      .populate('uploadedBy', 'name email');

    res.status(201).json({
      status: 'success',
      data: populatedDoc
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to upload document link'
    });
  }
};

// @desc    Upload document to project
// @route   POST /api/projects/:projectId/documents
// @access  Private (Admin/Lead)
export const uploadDocument = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { _id: userId } = req.user;
    const { name } = req.body;

    if (!req.file) {
      return res.status(400).json({
        status: 'fail',
        message: 'No file uploaded'
      });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({
        status: 'fail',
        message: 'Document name is required'
      });
    }


    // Get file extension
    const fileExtension = req.file.originalname.split('.').pop();
    const fileName = `${name.trim()}.${fileExtension}`;

    const document = await Document.create({
      project: projectId,
      name: fileName,
      data: req.file.buffer,
      contentType: req.file.mimetype,
      size: req.file.size,
      uploadedBy: userId
    });

    const populatedDoc = await Document.findById(document._id)
      .select('-data') // Exclude binary data from response
      .populate('uploadedBy', 'name email');

    res.status(201).json({
      status: 'success',
      data: populatedDoc
    });
  } catch (err) {
    console.log(err)
    res.status(500).json({
      status: 'error',
      message: 'Failed to upload document'
    });
  }
};

// @desc    Delete document
// @route   DELETE /api/projects/:projectId/documents/:docId
// @access  Private (Admin/Uploader)
export const deleteDocument = async (req, res) => {
  try {
    const { projectId, docId } = req.params;
    const { _id: userId } = req.user;

    const document = await Document.findById(docId);
    if (!document) {
      return res.status(404).json({
        status: 'fail',
        message: 'Document not found'
      });
    }

    // Verify document belongs to this project
    if (!document.project.equals(projectId)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Document does not belong to this project'
      });
    }

    await Document.findByIdAndDelete(docId);

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to delete document'
    });
  }
};