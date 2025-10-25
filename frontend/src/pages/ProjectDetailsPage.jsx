import { useState, useEffect, useRef } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Plus, Users, FileUp, ChevronDown, Calendar, FileText, UserPlus, X, Link as LinkIcon, Download } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import axiosInstance from '../services/axiosInstance';
import { toast } from 'react-hot-toast';
import Navbar from '../components/Navbar';
import ProjectChat from '../components/ProjectChats';
import ProjectTasks from '../components/ProjectTasks';
import DailyReports from '../components/DailyReports';

const ProjectDetails = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddMember, setShowAddMember] = useState(false);
  const [project, setProject] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  const [uploadType, setUploadType] = useState('file'); // 'file' or 'link'
  const [documentLink, setDocumentLink] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [documentName, setDocumentName] = useState('');
  const [documentFile, setDocumentFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const isLead = user.role === 'lead' && project?.lead._id === user._id;
  const isAdmin = user.role === 'admin';

  // Fetch project details and documents
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch project
        const projectRes = await axiosInstance.get(`/api/projects/${projectId}`);
        setProject(projectRes.data.data);

        // Fetch documents from separate collection
        const docsRes = await axiosInstance.get(`/api/projects/${projectId}/documents`);
        setDocuments(docsRes.data.data);
      } catch (err) {
        console.error('Failed to fetch data', err);
        toast.error(err.response?.data?.message || 'Failed to load project data');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId, navigate]);

  // Fetch available users for adding to team
  useEffect(() => {
    if ((isAdmin || isLead) && project) { // Ensure project is loaded
      const fetchAvailableUsers = async () => {
        try {
          const res = await axiosInstance.get('/api/projects/available-users');
          // Filter out users already in the team or the project lead
          const filteredUsers = res.data.data
            .filter(u => u.role === 'developer') // Only developers
            .filter(u => u._id !== project.lead._id) // Exclude project lead
            .filter(u => !project.team.some(member => member.userId._id === u._id)); // Exclude existing team members

          setAvailableUsers(filteredUsers);
        } catch (err) {
          console.error('Failed to fetch available users', err);
        }
      };

      fetchAvailableUsers();
    }
  }, [project, user, isAdmin, isLead]); // Add project to dependency array

  const handleAddMember = async (userId) => {
    try {
      const updatedProject = await axiosInstance.put(`/api/projects/${projectId}`, {
        team: [...project.team.map(m => ({ userId: m.userId._id })), { userId }]
      });
      setProject(updatedProject.data.data);
      toast.success('Team member added successfully');
      setShowAddMember(false);
    } catch (err) {
      console.error('Failed to add team member', err);
      toast.error(err.response?.data?.message || 'Failed to add team member');
    }
  };

 const handleRemoveMember = async (userId) => {
    try {
      const updatedProject = await axiosInstance.put(`/api/projects/${projectId}`, {
        team: project.team
          .filter(member => member.userId._id !== userId)
          .map(m => ({ userId: m.userId._id }))
      });
      setProject(updatedProject.data.data);
      toast.success('Team member removed successfully');
    } catch (err) {
      console.error('Failed to remove team member', err);
      toast.error(err.response?.data?.message || 'Failed to remove team member');
    }
  };

  const handleStatusChange = async () => {
    const newStatus = project.status === 'active' ? 'completed' : 'active';
    try {
      const updatedProject = await axiosInstance.put(`/api/projects/${projectId}`, {
        status: newStatus
      });
      setProject(updatedProject.data.data);
      toast.success(`Project marked as ${newStatus}`);
    } catch (err) {
      console.error('Failed to update project status', err);
      toast.error(err.response?.data?.message || 'Failed to update project status');
    }
  };

  const handleDeleteDocument = async (docId) => {
    try {
      await axiosInstance.delete(`/api/projects/${projectId}/documents/${docId}`);
      setDocuments(documents.filter(doc => doc._id !== docId));
      toast.success('Document deleted successfully');
    } catch (err) {
      console.error('Failed to delete document', err);
      toast.error(err.response?.data?.message || 'Failed to delete document');
    }
  };

  const handleDownloadDocument = async (docId) => {
    try {
      const docMeta = documents.find(doc => doc._id === docId);
      if (!docMeta) {
        toast.error('Document not found');
        return;
      }

      if (docMeta.isLink) {
        window.open(docMeta.link, '_blank', 'noopener,noreferrer');
        toast.success('Opening document link in new tab');
        return;
      }

      const response = await axiosInstance.get(
        `/api/projects/${projectId}/documents/${docId}/download`,
        {
          responseType: 'blob',
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', docMeta.name);
      document.body.appendChild(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Download started');
    } catch (err) {
      console.error('Download failed:', err);
      toast.error('Failed to download document');
    }
  };

  const handleUploadClick = () => {
    setShowUploadModal(true);
  };

  const handleFileChange = (e) => {
    if (e.target.files.length > 0) {
      setDocumentFile(e.target.files[0]);
    }
  };

  const handleUploadDocument = async () => {
    if (!documentName.trim()) {
      toast.error('Please enter a document name');
      return;
    }

    if (uploadType === 'file') {
      if (!documentFile) {
        toast.error('Please select a file to upload');
        return;
      }
    } else { // 'link'
      if (!documentLink.trim()) {
        toast.error('Please enter a document link');
        return;
      }
      try {
        new URL(documentLink); // Basic URL validation
      } catch (err) {
        toast.error('Please enter a valid URL (include http:// or https://)');
        return;
      }
    }

    setIsUploading(true);
    try {
      let res;
      if (uploadType === 'file') {
        const formData = new FormData();
        formData.append('document', documentFile);
        formData.append('name', documentName);

        res = await axiosInstance.post(
          `/api/projects/${projectId}/documents`,
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
      } else {
        res = await axiosInstance.post(
          `/api/projects/${projectId}/documents/link`,
          { name: documentName, link: documentLink }
        );
      }

      setDocuments([...documents, res.data.data]);
      toast.success('Document uploaded successfully');
      setShowUploadModal(false);
      resetUploadForm();
    } catch (err) {
      console.error('Failed to upload document', err);
      toast.error(err.response?.data?.message || 'Failed to upload document');
    } finally {
      setIsUploading(false);
    }
  };

  const resetUploadForm = () => {
    setDocumentName('');
    setDocumentFile(null);
    setDocumentLink('');
    setUploadType('file');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleModalClose = () => {
    setShowUploadModal(false);
    resetUploadForm();
  };

  if (loading || !project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Top Navigation Bar (re-used from Dashboard for consistency) */}
      <Navbar/>
      {/* Project Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-1">{project.name}</h1>
            <p className="text-sm text-gray-600">
              Project Status: {' '}
              <span className={`capitalize px-2 py-0.5 rounded-full text-xs font-semibold ${
                project.status === 'active'
                  ? 'bg-emerald-100 text-emerald-800'
                  : project.status === 'pending'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-indigo-100 text-indigo-800' // completed
              }`}>
                {project.status}
              </span>
            </p>
          </div>

          {(isAdmin) && (
            <div className="flex space-x-3 mt-4 sm:mt-0">
              <button
                onClick={handleStatusChange}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-colors duration-200"
              >
                {project.status === 'active' ? 'Mark as Completed' : 'Reactivate Project'}
              </button>
            </div>
          )}
        </div>

        {/* Project Tabs */}
        <div className="mt-6 border-b-2 border-gray-200">
          <nav className="-mb-px flex space-x-6 sm:space-x-8 overflow-x-auto pb-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`whitespace-nowrap py-3 px-1 border-b-3 font-semibold text-base transition-colors duration-200 ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-400'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`whitespace-nowrap py-3 px-1 border-b-3 font-semibold text-base transition-colors duration-200 ${
                activeTab === 'team'
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-400'
              }`}
            >
              Team
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`whitespace-nowrap py-3 px-1 border-b-3 font-semibold text-base transition-colors duration-200 ${
                activeTab === 'tasks'
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-400'
              }`}
            >
              Tasks
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`whitespace-nowrap py-3 px-1 border-b-3 font-semibold text-base transition-colors duration-200 ${
                activeTab === 'reports'
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-400'
              }`}
            >
              Daily Reports
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`whitespace-nowrap py-3 px-1 border-b-3 font-semibold text-base transition-colors duration-200 ${
                activeTab === 'documents'
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-400'
              }`}
            >
              Documents
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`whitespace-nowrap py-3 px-1 border-b-3 font-semibold text-base transition-colors duration-200 ${
                activeTab === 'chat'
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:border-gray-400'
              }`}
            >
              Chat
            </button>
          </nav>
        </div>
      </div>

      {/* Project Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <div className="bg-white shadow-lg rounded-xl overflow-hidden p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Project Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <div className="flex items-start">
                <Users className="flex-shrink-0 h-6 w-6 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Project Lead</p>
                  <p className="text-base text-gray-900">{project.lead?.name || 'N/A'}</p>
                </div>
              </div>

              <div className="flex items-start">
                <Calendar className="flex-shrink-0 h-6 w-6 text-blue-500 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Deadline</p>
                  <p className="text-base text-gray-900">
                    {new Date(project.deadline).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="col-span-1 md:col-span-2 mt-4">
                <p className="text-sm font-medium text-gray-600 mb-2">Description</p>
                <p className="text-base text-gray-800 leading-relaxed">
                  {project.description}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'team' && (
          <div className="bg-white shadow-lg rounded-xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Team Members</h3>
              {(isLead) && (
                <button
                  onClick={() => setShowAddMember(!showAddMember)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  <UserPlus className="mr-2 h-5 w-5" />
                  {showAddMember ? 'Close Add Member' : 'Add Member'}
                </button>
              )}
            </div>

            {showAddMember && (
              <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
                <h4 className="text-base font-semibold text-blue-800 mb-3">Available Developers to Add</h4>
                <div className="space-y-3">
                  {availableUsers.length === 0 ? (
                    <p className="text-sm text-gray-600">No new developers available to add.</p>
                  ) : (
                    availableUsers.map(u => (
                      <div key={u._id} className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm">
                        <div>
                          <p className="font-medium text-gray-900">{u.name}</p>
                          <p className="text-sm text-gray-500">{u.email}</p>
                        </div>
                        <button
                          onClick={() => handleAddMember(u._id)}
                          className="px-3 py-1.5 rounded-md text-sm font-semibold text-blue-600 border border-blue-200 hover:bg-blue-50 hover:text-blue-800 transition-colors duration-200"
                        >
                          Add to Team
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            <div className="divide-y divide-gray-200">
              {project.team.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-600">
                  <p className="text-lg">No team members assigned yet.</p>
                  <p className="text-sm mt-2">Use the "Add Member" button to get started!</p>
                </div>
              ) : (
                project.team.map(member => (
                  <div key={member.userId._id} className="px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors duration-150">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-base mr-4">
                        {member.userId.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{member.userId.name}</p>
                        <p className="text-sm text-gray-500">{member.userId.email}</p>
                      </div>
                    </div>
                    {(isLead) && (
                      <button
                        onClick={() => handleRemoveMember(member.userId._id)}
                        className="p-2 rounded-full text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-200"
                        title="Remove Member"
                      >
                        <X size={20} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="bg-white shadow-lg rounded-xl overflow-hidden p-6">
            <ProjectTasks projectId={projectId} project={project} />
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="bg-white shadow-lg rounded-xl overflow-hidden p-6">
            <DailyReports projectId={projectId} project={project} />
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="bg-white shadow-lg rounded-xl overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-900">Project Documents</h3>
              {(isAdmin || isLead) && (
                <button
                  onClick={handleUploadClick}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-semibold rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  <FileUp className="mr-2 h-5 w-5" />
                  Upload Document
                </button>
              )}
            </div>

            <div className="divide-y divide-gray-200">
              {documents?.length === 0 ? (
                <div className="px-6 py-12 text-center text-gray-600">
                  <p className="text-lg">No documents uploaded yet.</p>
                  <p className="text-sm mt-2">Be the first to upload project files or links!</p>
                </div>
              ) : (
                documents?.map(doc => (
                  <div key={doc._id} className="px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition-colors duration-150">
                    <div className="flex items-center flex-grow min-w-0">
                      {doc.isLink ? (
                        <LinkIcon className="h-6 w-6 text-blue-500 mr-4 flex-shrink-0" />
                      ) : (
                        <FileText className="h-6 w-6 text-gray-500 mr-4 flex-shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {doc.link ? (
                            <a
                              href={doc.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200"
                              title={doc.link}
                            >
                              {doc.name}
                            </a>
                          ) : (
                            doc.name
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          {doc.link ? 'Link' : 'File'} • Uploaded on {new Date(doc.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex space-x-3 ml-4 flex-shrink-0">
                      {doc.link ? (
                        <a 
                          href={doc.link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                        >
                          Open
                        </a>
                      ) : (
                        <button 
                          onClick={() => handleDownloadDocument(doc._id)}
                          className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                        >
                          Download
                        </button>
                      )}
                      {(isAdmin || isLead) && (
                        <button 
                          onClick={() => handleDeleteDocument(doc._id)}
                          className="text-red-600 hover:text-red-900 text-sm font-medium"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="bg-white shadow-lg rounded-xl overflow-hidden">
            <div className="">
              <ProjectChat projectId={projectId} />
            </div>
          </div>
        )}
      </div>

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/30 bg-opacity-40 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full animate-scale-in">
            <div className="p-7">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Upload New Document</h3>
                <button
                  onClick={handleModalClose}
                  className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors duration-200"
                  title="Close"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <label htmlFor="document-name" className="block text-sm font-semibold text-gray-700 mb-2">
                    Document Name
                  </label>
                  <input
                    type="text"
                    id="document-name"
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="e.g., Project Proposal, Design Mockups"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setUploadType('file')}
                    className={`flex items-center justify-center px-4 py-3 rounded-lg text-sm font-semibold border-2 transition-all duration-200 ${
                      uploadType === 'file'
                        ? 'bg-blue-50 text-blue-700 border-blue-400 shadow-sm'
                        : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    <FileUp size={20} className="mr-2" /> Upload File
                  </button>
                  <button
                    onClick={() => setUploadType('link')}
                    className={`flex items-center justify-center px-4 py-3 rounded-lg text-sm font-semibold border-2 transition-all duration-200 ${
                      uploadType === 'link'
                        ? 'bg-blue-50 text-blue-700 border-blue-400 shadow-sm'
                        : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    <LinkIcon size={20} className="mr-2" /> Add Link
                  </button>
                </div>

                {uploadType === 'file' ? (
                  <div>
                    <label htmlFor="document-file" className="block text-sm font-semibold text-gray-700 mb-2">
                      Select File
                    </label>
                    <div className="mt-1 flex items-center">
                      <input
                        ref={fileInputRef}
                        type="file"
                        id="document-file"
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg, .zip" // Added .zip for versatility
                      />
                      <label
                        htmlFor="document-file"
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer text-center"
                      >
                        {documentFile ? documentFile.name : 'Choose file...'}
                      </label>
                    </div>
                    {documentFile && (
                      <p className="mt-2 text-xs text-gray-500 text-right">
                        Size: {(documentFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <label htmlFor="document-link" className="block text-sm font-semibold text-gray-700 mb-2">
                      Document URL
                    </label>
                    <div className="mt-1 flex rounded-lg shadow-sm">
                      <span className="inline-flex items-center px-4 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                        <LinkIcon className="h-5 w-5" />
                      </span>
                      <input
                        type="url"
                        id="document-link"
                        value={documentLink}
                        onChange={(e) => setDocumentLink(e.target.value)}
                        className="flex-1 min-w-0 block w-full px-4 py-2 rounded-r-lg border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 sm:text-sm"
                        placeholder="https://example.com/document"
                      />
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      *Please include `http://` or `https://` for external links.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-7 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleModalClose}
                  disabled={isUploading}
                  className="px-5 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleUploadDocument}
                  disabled={isUploading || (uploadType === 'file' ? !documentFile : !documentLink) || !documentName.trim()}
                  className={`px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 ${
                    isUploading || (uploadType === 'file' ? !documentFile : !documentLink) || !documentName.trim() ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isUploading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Uploading...
                    </>
                  ) : uploadType === 'file' ? 'Upload File' : 'Add Link'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetails;