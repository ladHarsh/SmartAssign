import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import LoadingSpinner from '../LoadingSpinner';
import Header from '../header/Header';
import 'bootstrap/dist/css/bootstrap.min.css';
import { getApiUrl } from '../../config/api.config';

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [classrooms, setClassrooms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('users');
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);
    const { logout } = useAuth();
    const navigate = useNavigate();

    const alphabetColors = {
        'A': 'bg-danger',        
        'B': 'bg-primary',       
        'C': 'bg-success',       
        'D': 'bg-warning',       
        'E': 'bg-info',          
        'F': 'bg-secondary',     
        'G': 'bg-dark',          
        'H': 'bg-primary',       
        'I': 'bg-success',       
        'J': 'bg-danger',        
        'K': 'bg-warning',       
        'L': 'bg-info',          
        'M': 'bg-secondary',     
        'N': 'bg-dark',          
        'O': 'bg-danger',        
        'P': 'bg-primary',       
        'Q': 'bg-success',       
        'R': 'bg-warning',       
        'S': 'bg-info',          
        'T': 'bg-secondary',     
        'U': 'bg-dark',          
        'V': 'bg-danger',        
        'W': 'bg-primary',       
        'X': 'bg-success',       
        'Y': 'bg-warning',       
        'Z': 'bg-info'           
    };

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(getApiUrl('/admin/users'), {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(response.data.users);
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const fetchClassrooms = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(getApiUrl('/admin/classrooms'), {
                headers: { Authorization: `Bearer ${token}` }
            });
            setClassrooms(response.data.classrooms);
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to fetch classrooms');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Initial load of users data
        if (activeTab === 'users' && users.length === 0) {
            fetchUsers();
        }
        // Initial load of classrooms data
        if (activeTab === 'classrooms' && classrooms.length === 0) {
            fetchClassrooms();
        }
    }, [activeTab]);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setCurrentPage(1);
        setSearchTerm('');
        setRoleFilter('all');
        
        // Only fetch if data hasn't been loaded yet
        if (tab === 'users' && users.length === 0) {
            fetchUsers();
        } else if (tab === 'classrooms' && classrooms.length === 0) {
            fetchClassrooms();
        }
    };

    const handleDelete = async (id, type) => {
        if (window.confirm(`Are you sure you want to delete this ${type}?`)) {
            try {
                const token = localStorage.getItem('token');
                await axios.delete(getApiUrl(`/admin/${type}/${id}`), {
                    headers: { Authorization: `Bearer ${token}` }
                });
                // Only refresh the current tab's data
                if (type === 'users') {
                    fetchUsers();
                } else {
                    fetchClassrooms();
                }
                alert(`${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully`);
            } catch (error) {
                alert(error.response?.data?.message || `Failed to delete ${type}`);
            }
        }
    };

    const getFilteredData = (data, type) => {
        return data.filter(item =>
            (item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (type === 'users' ? item.email.toLowerCase() : item.subject.toLowerCase()).includes(searchTerm.toLowerCase())) &&
            (type === 'users' ? (roleFilter === 'all' || item.role === roleFilter) : true)
        );
    };

    const getPaginatedData = (data) => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return data.slice(startIndex, startIndex + itemsPerPage);
    };

    const getColor = (name) => {
        const firstLetter = name.charAt(0).toUpperCase();
        return alphabetColors[firstLetter] || 'bg-secondary';
    };

    const displayedData = getPaginatedData(getFilteredData(activeTab === 'users' ? users : classrooms, activeTab));

    return (
        <div className="bg-light min-vh-100">
            <Header />
            <div className="container-fluid px-4 py-4 mt-5">
                <div className="card shadow-sm border-0 rounded-lg overflow-hidden">
                    <div className="card-header bg-white py-3 d-flex justify-content-between">
                        <div className="nav nav-tabs card-header-tabs border-bottom-0">
                            {['users', 'classrooms'].map(tab => (
                                <button 
                                    key={tab} 
                                    className={`nav-link ${activeTab === tab ? 'active' : ''}`} 
                                    onClick={() => handleTabChange(tab)}
                                >
                                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="card-body">
                        <div className="row mb-3 align-items-center">
                            <div className="col-md-6 mb-2">
                                <input type="text" className="form-control border-primary" placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            </div>
                            {activeTab === 'users' && (
                                <div className="col-md-6 mb-2">
                                    <select className="form-select border-primary" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                                        <option value="all">All Roles</option>
                                        <option value="Admin">Admin</option>
                                        <option value="Faculty">Faculty</option>
                                        <option value="Student">Student</option>
                                    </select>
                                </div>
                            )}
                        </div>
                        <h4 className="mb-3">{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} List</h4>
                        {loading ? (
                            <LoadingSpinner />
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-striped">
                                    <thead className="table-dark">
                                        <tr>
                                            <th>Name</th>
                                            <th>{activeTab === 'users' ? 'Email' : 'Subject'}</th>
                                            {activeTab === 'users' && <th className="text-center" style={{width: '150px'}}>Role</th>}
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {displayedData.map(item => (
                                            <tr key={item._id}>
                                                <td className="d-flex align-items-center">
                                                    <div className={`rounded-circle text-white d-flex align-items-center justify-content-center me-2 ${getColor(item.name)}`} style={{ width: '35px', height: '35px', fontWeight: 'bold' }}>
                                                        {item.name[0].toUpperCase()}
                                                    </div>
                                                    {item.name.charAt(0).toUpperCase() + item.name.slice(1).toLowerCase()}
                                                </td>
                                                <td>{activeTab === 'users' ? item.email : item.subject}</td>
                                                {activeTab === 'users' && <td className="text-center" style={{width: '150px'}}>{item.role}</td>}
                                                <td>
                                                    <button className="btn btn-danger btn-sm px-3" onClick={() => handleDelete(item._id, activeTab)}>
                                                        Remove
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;