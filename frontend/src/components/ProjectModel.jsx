// components/ProjectModal.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Calendar as CalendarIcon, Users, ChevronDown } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import { toast } from 'react-hot-toast';
import axiosInstance from '../services/axiosInstance';

const ProjectModal = ({ onClose, projectId, onSuccess }) => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [availableUsers, setAvailableUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const isEditMode = !!projectId; 

  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    deadline: new Date(),
    status: 'active',
    lead: user.role === 'lead' ? user._id : '',
  });

  // Date selection state
  const [selectedDate, setSelectedDate] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth(),
    day: new Date().getDate()
  });

  // Fetch available users and project data (if edit mode)
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch available users
        const usersRes = await axiosInstance.get('/api/projects/available-users');
        setAvailableUsers(usersRes.data.data);

        // If editing, fetch project data
        if (isEditMode) {
          const projectRes = await axiosInstance.get(`/api/projects/${projectId}`);
          const project = projectRes.data.data;
          
          setFormData({
            name: project.name,
            description: project.description,
            deadline: new Date(project.deadline),
            status: project.status,
            lead: project.lead._id,
          });

          // Set date picker to project deadline
          const deadline = new Date(project.deadline);
          setSelectedDate({
            year: deadline.getFullYear(),
            month: deadline.getMonth(),
            day: deadline.getDate()
          });
        }
      } catch (err) {
        console.error('Failed to fetch data', err);
        toast.error(err.response?.data?.message || 'Failed to load data');
        onClose();
      }
    };

    fetchData();
  }, [projectId, isEditMode, onClose, user.role, user._id]);

  // Format date for display
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Generate years (current year + next 5 years)
  const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() + i);
  
  // Months for date picker
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Get days in month
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Days array for selected month/year
  const days = Array.from({ length: getDaysInMonth(selectedDate.year, selectedDate.month) }, (_, i) => i + 1);

  // Update formData.deadline when selectedDate changes
  useEffect(() => {
    const newDate = new Date(selectedDate.year, selectedDate.month, selectedDate.day);
    setFormData(prev => ({ ...prev, deadline: newDate }));
  }, [selectedDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const payload = {
        ...formData,
      };

      let response;
      if (isEditMode) {
        response = await axiosInstance.put(`/api/projects/${projectId}`, payload);
        toast.success('Project updated successfully');
      } else {
        response = await axiosInstance.post('/api/projects', payload);
        toast.success('Project created successfully');
      }

      onSuccess(response.data.data);
      onClose();
    } catch (err) {
      console.error('Failed to save project', err);
      toast.error(err.response?.data?.message || 'Failed to save project');
    } finally {
      setIsLoading(false);
    }
  };


  // Separate leads and developers
  const leads = availableUsers.filter(user => user.role === 'lead');

  return (
    <div className="fixed inset-0 bg-slate-900/20 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b p-4 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold">
            {isEditMode ? 'Edit Project' : 'Create New Project'}
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Project Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Project Name *
            </label>
            <input
              type="text"
              id="name"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          
          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              id="description"
              rows={3}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Deadline */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deadline *
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowDatePicker(!showDatePicker)}
                  className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <span>{formatDate(formData.deadline)}</span>
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                </button>
                
                {showDatePicker && (
                  <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                      <select
                        value={selectedDate.year}
                        onChange={(e) => setSelectedDate({ ...selectedDate, year: parseInt(e.target.value) })}
                        className="bg-gray-100 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        {years.map(year => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                      
                      <select
                        value={selectedDate.month}
                        onChange={(e) => setSelectedDate({ ...selectedDate, month: parseInt(e.target.value) })}
                        className="bg-gray-100 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        {months.map((month, index) => (
                          <option key={month} value={index}>{month}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="grid grid-cols-7 gap-1">
                      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                        <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                          {day}
                        </div>
                      ))}
                      
                      {Array.from({ length: new Date(selectedDate.year, selectedDate.month, 1).getDay() }).map((_, i) => (
                        <div key={`empty-${i}`} className="h-8"></div>
                      ))}
                      
                      {days.map(day => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            setSelectedDate({ ...selectedDate, day });
                            setShowDatePicker(false);
                          }}
                          className={`h-8 w-8 rounded-full flex items-center justify-center text-sm ${
                            selectedDate.day === day 
                              ? 'bg-indigo-600 text-white' 
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          
          {/* Project Lead (only for admins) */}
          {user.role === 'admin' && (
            <div>
              <label htmlFor="lead" className="block text-sm font-medium text-gray-700 mb-1">
                Project Lead *
              </label>
              <div className="relative">
                <select
                  id="lead"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  value={formData.lead}
                  onChange={(e) => setFormData({ ...formData, lead: e.target.value })}
                >
                  <option value="">Select a lead</option>
                  {leads.map(lead => (
                    <option key={lead._id} value={lead._id}>
                      {lead.name} ({lead.email})
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                </div>
              </div>
            </div>
          )}
          
          
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                isLoading ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              {isLoading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Project' : 'Create Project')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProjectModal;