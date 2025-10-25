import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Loader2, X, Home, LogOut } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import { toast } from 'react-hot-toast';
import axiosInstance from '../services/axiosInstance';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar'; // Import the new Navbar component

const UserManagement = () => {
    const { user, logout } = useAuthStore();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    // Fetch users from backend
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await axiosInstance.get('/api/admin/users');
                const usersData = res.data?.data?.users || [];
                setUsers(Array.isArray(usersData) ? usersData : []);
            } catch (err) {
                console.error('Failed to fetch users', err);
                setError(err.response?.data?.message || 'Failed to fetch users. Please try again.');
                toast.error(err.response?.data?.message || 'Failed to fetch users.');
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    // Handle user deletion
    const handleDelete = async (userId) => {
        const confirmDelete = await new Promise((resolve) => {
            toast((t) => (
                <div className="flex flex-col items-center p-4">
                    <p className="text-gray-800 text-lg font-semibold mb-3">Are you sure you want to delete this user?</p>
                    <div className="flex gap-3">
                        <button
                            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
                            onClick={() => {
                                toast.dismiss(t.id);
                                resolve(true);
                            }}
                        >
                            Delete
                        </button>
                        <button
                            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg transition duration-200"
                            onClick={() => {
                                toast.dismiss(t.id);
                                resolve(false);
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ), { duration: Infinity, style: { background: '#fff', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' } });
        });

        if (!confirmDelete) return;

        try {
            setDeletingId(userId);
            await axiosInstance.delete(`/api/admin/users/${userId}`);
            setUsers(prevUsers => prevUsers.filter(u => u._id !== userId));
            toast.success('User deleted successfully!');
        } catch (err) {
            console.error('Failed to delete user', err);
            toast.error(err.response?.data?.message || 'Failed to delete user.');
        } finally {
            setDeletingId(null);
        }
    };

    // Open modal for adding new user
    const openAddModal = () => {
        setCurrentUser(null);
        setIsModalOpen(true);
    };

    // Open modal for editing user
    const openEditModal = (user) => {
        setCurrentUser(user);
        setIsModalOpen(true);
    };

    // Handle successful form submission
    const handleSuccess = (updatedUser, isNew) => {
        if (isNew) {
            setUsers(prevUsers => [...prevUsers, updatedUser]);
        } else {
            setUsers(prevUsers => prevUsers.map(u => u._id === updatedUser._id ? updatedUser : u));
        }
        setIsModalOpen(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
                <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mb-4" />
                <p className="text-gray-700 text-lg font-medium">Loading users...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
                <div className="bg-white p-8 rounded-xl shadow-lg max-w-md w-full text-center">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Users</h2>
                    <p className="text-gray-700 mb-6">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition duration-200 text-lg font-medium"
                    >
                        Retry Loading
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-100 font-sans antialiased">

            {/* Use the new Navbar component */}
            <Navbar />

            {/* User Management Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-900">User Management</h1>
                    <button
                        onClick={openAddModal}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-semibold rounded-lg shadow-md text-white bg-indigo-600 hover:bg-indigo-700 transition duration-200 transform hover:scale-105"
                    >
                        <Plus className="mr-2 h-5 w-5" />
                        Add New User
                    </button>
                </div>

                <div className="bg-white shadow-lg rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Name
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Role
                                    </th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-8 text-center text-base text-gray-500">
                                            No users found. Click "Add New User" to get started!
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((userItem) => (
                                        <tr key={userItem._id} className="hover:bg-gray-50 transition duration-100 ease-in-out">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-11 w-11 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-lg font-bold shadow-sm">
                                                        {userItem.name?.charAt(0).toUpperCase() || 'U'}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">{userItem.name || 'N/A'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                {userItem.email}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-3 py-1 text-xs font-semibold rounded-full capitalize ${
                                                    userItem.role === 'admin'
                                                        ? 'bg-purple-100 text-purple-800'
                                                        : userItem.role === 'lead'
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : 'bg-green-100 text-green-800'
                                                }`}>
                                                    {userItem.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex space-x-3">
                                                    <button
                                                        onClick={() => openEditModal(userItem)}
                                                        className="text-indigo-600 hover:text-indigo-800 flex items-center group transition duration-150 ease-in-out"
                                                        title="Edit user"
                                                    >
                                                        <Edit className="mr-1 h-4 w-4 group-hover:scale-110 transition-transform" />
                                                        Edit
                                                    </button>
                                                    {userItem._id !== user._id && (
                                                        <button
                                                            onClick={() => handleDelete(userItem._id)}
                                                            disabled={deletingId === userItem._id}
                                                            className="text-red-600 hover:text-red-800 flex items-center group disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 ease-in-out"
                                                            title="Delete user"
                                                        >
                                                            {deletingId === userItem._id ? (
                                                                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="mr-1 h-4 w-4 group-hover:scale-110 transition-transform" />
                                                            )}
                                                            Delete
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* User Form Modal */}
            {isModalOpen && (
                <UserFormModal
                    user={currentUser}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={handleSuccess}
                />
            )}
        </div>
    );
};

// ---
// User Form Modal Component (No changes needed here as per request, just included for completeness)
// ---

const UserFormModal = ({ user, onClose, onSuccess }) => {
    const isEditMode = !!user;
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        role: user?.role || 'developer',
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const payload = {
                name: formData.name,
                email: formData.email,
                role: formData.role,
            };

            let response;
            if (isEditMode) {
                response = await axiosInstance.put(`/api/admin/users/${user._id}`, payload);
            } else {
                response = await axiosInstance.post('/api/admin/users', payload);
            }
            toast.success(isEditMode ? 'User updated successfully!' : 'User created successfully!');
            onSuccess(response.data.data.user, !isEditMode);
        } catch (err) {
            console.error('Failed to save user', err);
            toast.error(err.response?.data?.message || err.message || 'Failed to save user. Please check your inputs.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/20 bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg transform scale-95 animate-scale-in">
                <div className="flex justify-between items-center border-b border-gray-200 p-5">
                    <h2 className="text-2xl font-bold text-gray-800">
                        {isEditMode ? 'Edit User' : 'Create New User'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 transition duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-full p-1"
                        aria-label="Close modal"
                    >
                        <X size={28} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                            Name
                        </label>
                        <input
                            type="text"
                            id="name"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 transition duration-150"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Enter user's full name"
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                            Email <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="email"
                            id="email"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 transition duration-150 disabled:bg-gray-50 disabled:cursor-not-allowed"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            disabled={isEditMode}
                            placeholder="Enter user's email address"
                        />
                        {isEditMode && (
                            <p className="mt-1 text-xs text-gray-500">Email cannot be changed for existing users.</p>
                        )}
                    </div>

                    <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                            Role <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="role"
                            required
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-800 bg-white transition duration-150"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        >
                            <option value="admin">Admin</option>
                            <option value="lead">Project Lead</option>
                            <option value="developer">Developer</option>
                        </select>
                    </div>


                    <div className="flex justify-end space-x-4 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 border border-gray-300 rounded-lg shadow-sm text-base font-medium text-gray-700 bg-white hover:bg-gray-50 transition duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className={`inline-flex items-center px-5 py-2.5 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                                loading ? 'opacity-70 cursor-not-allowed' : 'transform hover:scale-105'
                            }`}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-5 w-5 mr-3 animate-spin" /> Saving...
                                </>
                            ) : (
                                isEditMode ? 'Update User' : 'Create User'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


export default UserManagement;