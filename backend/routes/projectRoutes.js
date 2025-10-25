import express from 'express';
import { authenticate, authorizeRoles } from '../middlewares/auth.js';
import {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  getAvailableUsers,
  uploadDocument,
  deleteDocument,
  getProjectDocuments,
  downloadDocument,
  uploadDocumentLink
} from '../controllers/projectController.js';
import upload from '../utils/upload.js';

const router = express.Router();

// Get available users (admin/lead only)
router.get('/projects/available-users',  getAvailableUsers);

// Get all projects (for authenticated users)
router.get('/projects', authenticate, getProjects);

// Get single project by ID
router.get('/projects/:id', authenticate, getProject);

// Create project (admin only)
router.post('/projects', authenticate, authorizeRoles('admin'), createProject);

// Update project (admin/lead only)
router.put('/projects/:id', authenticate, authorizeRoles('admin', 'lead'), updateProject);

// Delete project (admin only)
router.delete('/projects/:id', authenticate, authorizeRoles('admin'), deleteProject);

// Get all documents for a project (without binary data)
router.get('/projects/:projectId/documents', authenticate, getProjectDocuments);

// Download a specific document (with binary data)
router.get('/projects/:projectId/documents/:docId/download', authenticate, downloadDocument);

// Upload document link to project
router.post(
  '/projects/:projectId/documents/link',
  authenticate,
  authorizeRoles('admin', 'lead'),
  uploadDocumentLink
);


// Upload document to project
router.post(
  '/projects/:projectId/documents',
  authenticate,
  authorizeRoles('admin', 'lead'),
  upload.single('document'),
  uploadDocument
);

// Delete document
router.delete(
  '/projects/:projectId/documents/:docId',
  authenticate,
  authorizeRoles('admin', 'lead'),
  deleteDocument
);

export default router;
