import React, { useEffect, useState, useContext } from 'react';
import { Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from '@mui/material';
import http from '../http';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import UserContext from '../contexts/UserContext';
import { useNavigate } from 'react-router-dom';

function AdminDashboard() {
    const { user } = useContext(UserContext);
    const [admins, setAdmins] = useState([]);
    const [users, setUsers] = useState([]);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true); 

    useEffect(() => {
        if (user && user.role === 'Admin') {
            // Fetch admin data
            http.get("/admin/all")
                .then((res) => {
                    setAdmins(res.data);
                })
                .catch((err) => {
                    toast.error("Failed to fetch admin data.");
                    console.error("Error fetching admins:", err);
                });

            // Fetch user data
            http.get("/user/all")
                .then((res) => {
                    setUsers(res.data);
                })
                .catch((err) => {
                    toast.error("Failed to fetch user data.");
                    console.error("Error fetching users:", err);
                })
                .finally(() => {
                    setLoading(false); // Stop loading after fetching data
                });
        } else {
            // Redirect non-admin users
            toast.error("You do not have admin permissions.");
            navigate('/not-authorized');
        }
    }, [user, navigate]);

    if (loading) {
        return <Typography>Loading...</Typography>; // Show a loading message
    }

    if (!user || user.role !== 'Admin') {
        return null; // Do not render the dashboard for non-admin users
    }

    const handleToggleActivation = (id, type, isDeactivated) => {
        const endpoint = isDeactivated ? `activate` : `deactivate`;

        http.put(`/${type}/${endpoint}/${id}`)
            .then(() => {
                toast.success(
                    `${type.charAt(0).toUpperCase() + type.slice(1)} ${isDeactivated ? 'activated' : 'deactivated'} successfully.`
                );

                // Update the local state
                const updatedEntity = type === 'admin' ? admins : users;
                const updatedData = updatedEntity.map((item) =>
                    item[`${type}ID`] === id ? { ...item, isDeactivated: !isDeactivated } : item
                );

                if (type === 'admin') {
                    setAdmins(updatedData);
                } else {
                    setUsers(updatedData);
                }
            })
            .catch((err) => {
                toast.error(`Failed to ${isDeactivated ? 'activate' : 'deactivate'}.`);
                console.error(`Error ${isDeactivated ? 'activating' : 'deactivating'}:`, err);
            });
    };

    const handleUpdate = (id, type) => {
        navigate(`/update-${type}/${id}`);
    };

    // Check if the admin is the super admin
    const isSuperAdmin = (admin) => {
        return admin.adminID === 1 && admin.email === 'superadmin@greenthread.com';
    };

    return (
        <Box sx={{ mt: 4, mx: 'auto', maxWidth: '800px' }}>
            <Typography variant="h4" sx={{ mb: 4 }}>
                Admin Dashboard
            </Typography>

            {/* Admin List */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h5">
                    Admins
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate('/create-admin')}
                >
                    Create Admin
                </Button>
            </Box>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell><strong>Admin ID</strong></TableCell>
                            <TableCell><strong>Email</strong></TableCell>
                            <TableCell><strong>Status</strong></TableCell>
                            <TableCell><strong>Actions</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {admins.map((admin) => (
                            <TableRow key={admin.adminID}>
                                <TableCell>{admin.adminID}</TableCell>
                                <TableCell>{admin.email}</TableCell>
                                <TableCell>
                                    {admin.isDeactivated ? "Deactivated" : "Active"}
                                </TableCell>
                                <TableCell>
                                    {/* Conditionally render buttons for non-super admin */}
                                    {!isSuperAdmin(admin) && (
                                        <>
                                            <Button
                                                variant="contained"
                                                sx={{
                                                    backgroundColor: admin.isDeactivated ? 'orange' : 'error.main',
                                                    mr: 2
                                                }}
                                                onClick={() => handleToggleActivation(admin.adminID, 'admin', admin.isDeactivated)}
                                            >
                                                {admin.isDeactivated ? "Activate" : "Deactivate"}
                                            </Button>
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                onClick={() => handleUpdate(admin.adminID, 'admin')}
                                            >
                                                Update
                                            </Button>
                                        </>
                                    )}
                                    {/* Display message for super admin */}
                                    {isSuperAdmin(admin) && (
                                        <Typography variant="body2" color="textSecondary">
                                            Super Admin cannot be updated or deactivated.
                                        </Typography>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* User List */}
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 4, mb: 2 }}>
                <Typography variant="h5">
                    Users
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={() => navigate('/create-user')}
                >
                    Create User
                </Button>
            </Box>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell><strong>User ID</strong></TableCell>
                            <TableCell><strong>First Name</strong></TableCell>
                            <TableCell><strong>Last Name</strong></TableCell>
                            <TableCell><strong>Email</strong></TableCell>
                            <TableCell><strong>Postal Code</strong></TableCell>
                            <TableCell><strong>Status</strong></TableCell>
                            <TableCell><strong>Actions</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {users.map((user) => (
                            <TableRow key={user.userID}>
                                <TableCell>{user.userID}</TableCell>
                                <TableCell>{user.firstName}</TableCell>
                                <TableCell>{user.lastName}</TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>{user.postalCode}</TableCell>
                                <TableCell>
                                    {user.isDeactivated ? "Deactivated" : "Active"}
                                </TableCell>
                                <TableCell>
                                    <Button
                                        variant="contained"
                                        sx={{
                                            backgroundColor: user.isDeactivated ? 'orange' : 'error.main',
                                            mr: 2
                                        }}
                                        onClick={() => handleToggleActivation(user.userID, 'user', user.isDeactivated)}
                                    >
                                        {user.isDeactivated ? "Activate" : "Deactivate"}
                                    </Button>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={() => handleUpdate(user.userID, 'user')}
                                    >
                                        Update
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            <ToastContainer />
        </Box>
    );
}

export default AdminDashboard;