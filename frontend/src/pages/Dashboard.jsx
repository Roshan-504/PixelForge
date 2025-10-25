import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Users, ChevronDown, Calendar, FileText, CheckCircle, Trash } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import ProjectModal from '../components/ProjectModel';
import axiosInstance from '../services/axiosInstance';
import { toast } from 'react-hot-toast';
import Navbar from '../components/Navbar';

const Dashboard = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch projects from backend
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await axiosInstance.get('/api/projects');
        setProjects(res.data.data || []);
      } catch (err) {
        console.error('Failed to fetch projects', err);
        toast.error(err.response?.data?.message || 'Failed to fetch projects');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Handle project status change
  const handleStatusChange = async (projectId, newStatus) => {
    try {
      await axiosInstance.put(`/api/projects/${projectId}`, { status: newStatus });
      setProjects(projects.map(p =>
        p._id === projectId ? { ...p, status: newStatus } : p
      ));
      toast.success(`Project marked as ${newStatus}`);
    } catch (err) {
      console.error('Failed to update project status', err);
      toast.error(err.response?.data?.message || 'Failed to update project');
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;

    try {
      await axiosInstance.delete(`/api/projects/${projectId}`);
      setProjects(projects.filter(p => p._id !== projectId));
      toast.success('Project deleted successfully');
    } catch (err) {
      console.error('Failed to delete project', err);
      toast.error(err.response?.data?.message || 'Failed to delete project');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-400"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* Top Navigation Bar */}
      <Navbar/>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <h1 className="text-3xl font-extrabold text-gray-900">
            {user.role === 'developer' ? 'My Projects' : 'Projects Overview'}
          </h1>

          {(user.role === 'admin') && (
            <button
              onClick={() => setShowProjectModal(true)}
              className="flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg text-base font-semibold shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 transition-colors duration-200"
            >
              <Plus size={20} className="mr-2" />
              New Project
            </button>
          )}
        </div>

        {projects.length === 0 && !loading && (
            <div className="bg-white p-8 rounded-lg shadow-md text-center text-gray-600">
                <p className="text-lg mb-4">No projects found !</p>
                {(user.role === 'admin') && (
                    <button
                        onClick={() => setShowProjectModal(true)}
                        className="inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-md shadow-sm hover:bg-blue-600 transition-colors duration-200"
                    >
                        <Plus size={18} className="mr-2" />
                        Create Your First Project
                    </button>
                )}
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map(project => (
            <ProjectCard
              key={project._id}
              project={project}
              role={user.role}
              currentUserId={user._id}
              onStatusChange={handleStatusChange}
              handleDeleteProject={handleDeleteProject}
            />
          ))}
        </div>
      </main>

      {showProjectModal && (
        <ProjectModal
          onClose={() => setShowProjectModal(false)}
          onSuccess={(newProject) => {
            setProjects([...projects, newProject]);
            setShowProjectModal(false);
            toast.success('Project created successfully!');
          }}
        />
      )}
    </div>
  );
};

// ---
// Project Card Component
const ProjectCard = ({ project, role, currentUserId, onStatusChange, handleDeleteProject }) => {
  const isLead = project.lead?._id === currentUserId;
  const isDeveloper = project.team.some(member => member._id === currentUserId);

  return (
    <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 leading-tight">
            <Link to={`/projects/${project._id}`} className="hover:text-blue-700 transition-colors duration-200">
              {project.name}
            </Link>
          </h3>
          <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
            project.status === 'active'
              ? 'bg-emerald-100 text-emerald-800'
              : project.status === 'pending'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-indigo-100 text-indigo-800' // completed
          }`}>
            {project.status}
          </span>
        </div>

        <p className="mt-2 text-sm text-gray-600 line-clamp-3 mb-2">
            {project.description}
        </p>
        

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-4 text-sm mb-6">
          <div className="flex items-center text-gray-700">
            <Calendar className="flex-shrink-0 h-5 w-5 text-blue-400 mr-2" />
            <div>
              <p className="text-xs text-gray-500">Deadline</p>
              <p className="font-medium">
                {new Date(project.deadline).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center text-gray-700">
            <Users className="flex-shrink-0 h-5 w-5 text-blue-400 mr-2" />
            <div>
              <p className="text-xs text-gray-500">Lead</p>
              <p className="font-medium">
                {project.lead?.name || 'N/A'}
              </p>
            </div>
          </div>

          <div className="flex items-center text-gray-700">
            <Users className="flex-shrink-0 h-5 w-5 text-blue-400 mr-2" />
            <div>
              <p className="text-xs text-gray-500">Team</p>
              <p className="font-medium">
                {project.team.length} member{project.team.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center text-gray-700">
            <FileText className="flex-shrink-0 h-5 w-5 text-blue-400 mr-2" />
            <div>
              <p className="text-xs text-gray-500">Documents</p>
              <p className="font-medium">
                {project.documentCount ?? 0} file{project.documentCount !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to={`/projects/${project._id}`}
            className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-blue-300 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-colors duration-200"
          >
            <Users className="mr-2 h-4 w-4" />
            View Details
          </Link>


          {role === 'admin' && (
            <button
              onClick={() => handleDeleteProject(project._id)}
              className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-red-300 bg-red-50 text-red-700 rounded-lg text-sm font-medium hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-200 transition-colors duration-200"
            >
              <Trash className="mr-2 h-4 w-4" />
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;