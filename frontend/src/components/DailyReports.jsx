import { useState, useEffect } from 'react';
import { Plus, Calendar, Clock, AlertCircle, CheckCircle, Edit } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import axiosInstance from '../services/axiosInstance';
import { toast } from 'react-hot-toast';

const DailyReports = ({ projectId, project }) => {
  const { user } = useAuthStore();
  const [reports, setReports] = useState([]);
  const [todayReport, setTodayReport] = useState(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [dailyReport, setDailyReport] = useState({
    workCompleted: '',
    workPlanned: '',
    blockers: '',
    hoursWorked: 8
  });

  const isLead = user.role === 'lead' && project?.lead._id === user._id;
  const isAdmin = user.role === 'admin';
  const canViewAll = isLead || isAdmin;
  
  // Check if current user is a team member (developer) who should submit reports
  const isTeamMember = project?.team.some(member => 
    member.userId._id === user._id
  );
  const shouldSubmitReports = isTeamMember && !isLead; // Developers submit, leads don't

  useEffect(() => {
    fetchReports();
    if (shouldSubmitReports) {
      fetchTodayReport();
    }
  }, [projectId, shouldSubmitReports]);

  const fetchReports = async () => {
    try {
      const response = await axiosInstance.get(`/api/projects/${projectId}/daily-reports`);
      setReports(response.data.data);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
      toast.error('Failed to load daily reports');
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayReport = async () => {
    try {
      const response = await axiosInstance.get(`/api/projects/${projectId}/daily-reports/today`);
      setTodayReport(response.data.data);
    } catch (error) {
      // It's okay if no report exists for today
      setTodayReport(null);
    }
  };

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await axiosInstance.post(
        `/api/projects/${projectId}/daily-reports`,
        dailyReport
      );

      setTodayReport(response.data.data);
      setReports([response.data.data, ...reports]);
      setShowReportModal(false);
      setDailyReport({
        workCompleted: '',
        workPlanned: '',
        blockers: '',
        hoursWorked: 8
      });
      toast.success('Daily report submitted successfully!');
    } catch (error) {
      console.error('Failed to submit report:', error);
      toast.error(error.response?.data?.message || 'Failed to submit daily report');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isToday = (dateString) => {
    const today = new Date();
    const reportDate = new Date(dateString);
    return today.toDateString() === reportDate.toDateString();
  };

  const getHoursWorkedColor = (hours) => {
    if (hours >= 8) return 'text-green-600 bg-green-100';
    if (hours >= 6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Daily Progress Reports</h2>
          <p className="text-gray-600">
            {canViewAll ? 'Team daily updates' : 'Track your daily progress'}
          </p>
        </div>
        
        {/* Only show submit button for developers who are team members */}
        {shouldSubmitReports && !todayReport && (
          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={16} className="mr-2" />
            Submit Today's Report
          </button>
        )}
      </div>

      {/* Today's Report Status - Only show for developers */}
      {shouldSubmitReports && (
        todayReport ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <CheckCircle className="text-green-600 mr-3" size={24} />
                <div>
                  <h3 className="font-semibold text-green-800">Today's Report Submitted</h3>
                  <p className="text-green-600 text-sm">
                    You've already submitted your progress report for today.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowReportModal(true)}
                className="flex items-center px-3 py-1 text-green-700 border border-green-300 rounded-md hover:bg-green-100"
              >
                <Edit size={14} className="mr-1" />
                View/Edit
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="text-yellow-600 mr-3" size={24} />
              <div>
                <h3 className="font-semibold text-yellow-800">Report Pending</h3>
                <p className="text-yellow-600 text-sm">
                  You haven't submitted your daily progress report yet.
                </p>
              </div>
            </div>
          </div>
        )
      )}

      {/* Reports List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-800">
              {canViewAll ? 'Team Reports' : 'Your Reports'}
            </h3>
            <span className="text-sm text-gray-500">
              {reports.length} report{reports.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {reports.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Calendar className="mx-auto mb-3 text-gray-400" size={32} />
              <p>No daily reports submitted yet.</p>
              {shouldSubmitReports && !todayReport && (
                <button
                  onClick={() => setShowReportModal(true)}
                  className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
                >
                  Be the first to submit a report!
                </button>
              )}
            </div>
          ) : (
            reports.map((report) => (
              <div key={report._id} className="p-4 hover:bg-gray-50">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-gray-900">
                        {report.userId.name}
                        {report.userId._id === user._id && (
                          <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            You
                          </span>
                        )}
                      </h4>
                      {isToday(report.reportDate) && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          Today
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {formatDate(report.reportDate)}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getHoursWorkedColor(report.hoursWorked)}`}>
                    <Clock size={12} className="inline mr-1" />
                    {report.hoursWorked}h
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <h5 className="font-medium text-gray-700 mb-1">Work Completed</h5>
                    <p className="text-gray-600">{report.workCompleted}</p>
                  </div>
                  
                  {report.workPlanned && (
                    <div>
                      <h5 className="font-medium text-gray-700 mb-1">Planned Work</h5>
                      <p className="text-gray-600">{report.workPlanned}</p>
                    </div>
                  )}
                  
                  {report.blockers && (
                    <div>
                      <h5 className="font-medium text-gray-700 mb-1">Blockers</h5>
                      <p className="text-red-600">{report.blockers}</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Submit Report Modal - Only for developers */}
      {showReportModal && shouldSubmitReports && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold">
                {todayReport ? "Today's Daily Report" : "Submit Daily Report"}
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                Share your progress, plans, and any challenges for today.
              </p>
            </div>

            <form onSubmit={handleSubmitReport} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Work Completed Today *
                </label>
                <textarea
                  required
                  value={dailyReport.workCompleted}
                  onChange={(e) => setDailyReport({...dailyReport, workCompleted: e.target.value})}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Describe what you accomplished today..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Work Planned for Tomorrow
                </label>
                <textarea
                  value={dailyReport.workPlanned}
                  onChange={(e) => setDailyReport({...dailyReport, workPlanned: e.target.value})}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="What do you plan to work on tomorrow?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Blockers or Challenges
                </label>
                <textarea
                  value={dailyReport.blockers}
                  onChange={(e) => setDailyReport({...dailyReport, blockers: e.target.value})}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Any issues preventing you from making progress?"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hours Worked Today *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="24"
                    step="0.5"
                    value={dailyReport.hoursWorked}
                    onChange={(e) => setDailyReport({...dailyReport, hoursWorked: parseFloat(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyReports;