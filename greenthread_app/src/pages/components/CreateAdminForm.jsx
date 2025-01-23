import React, { useEffect, useContext, useState } from 'react';
import { Box, Typography, TextField, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as yup from 'yup';
import http from '../../http';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import UserContext from '../../contexts/UserContext';

// Validation schema for admin registration
const adminValidationSchema = yup.object({
    email: yup.string().trim()
        .email('Enter a valid email')
        .max(50, 'Email must be at most 50 characters')
        .required('Email is required'),
    password: yup.string().trim()
        .min(8, 'Password must be at least 8 characters')
        .max(50, 'Password must be at most 50 characters')
        .matches(
            /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
            'Password must contain at least 1 uppercase letter, 1 number, and 1 special character'
        )
        .required('Password is required'),
    confirmPassword: yup.string().trim()
        .oneOf([yup.ref('password'), null], 'Passwords must match')
        .required('Confirm Password is required')
});

function CreateAdminForm() {
    const { user } = useContext(UserContext);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true); // Loading state

    // Redirect non-admin users
    useEffect(() => {
        if (user && user.role === 'Admin') {
            setLoading(false); // Allow access to the form
        } else {
            toast.error("You do not have admin permissions.");
            navigate('/not-authorized'); // Redirect to Not Authorized page
        }
    }, [user, navigate]);

    const formik = useFormik({
        initialValues: {
            email: '',
            password: '',
            confirmPassword: ''
        },
        validationSchema: adminValidationSchema,
        onSubmit: (data) => {
            data.email = data.email.trim().toLowerCase();
            data.password = data.password.trim();

            http.post('/admin/register', data)
                .then(() => {
                    toast.success('Admin registered successfully.');
                    navigate('/admin-dashboard');
                })
                .catch((err) => {
                    toast.error(err.response?.data?.message || 'Failed to register admin.');
                    console.error('Error registering admin:', err);
                });
        }
    });

    // Show loading state while checking user role
    if (loading) {
        return <Typography>Loading...</Typography>;
    }

    return (
        <Box sx={{ mt: 4, mx: 'auto', maxWidth: '500px' }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
                Create Admin
            </Typography>
            <Box component="form" onSubmit={formik.handleSubmit}>
                <TextField
                    fullWidth margin="dense" autoComplete="off"
                    label="Email"
                    name="email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.email && Boolean(formik.errors.email)}
                    helperText={formik.touched.email && formik.errors.email}
                />
                <TextField
                    fullWidth margin="dense" autoComplete="off"
                    label="Password"
                    name="password" type="password"
                    value={formik.values.password}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.password && Boolean(formik.errors.password)}
                    helperText={formik.touched.password && formik.errors.password}
                />
                <TextField
                    fullWidth margin="dense" autoComplete="off"
                    label="Confirm Password"
                    name="confirmPassword" type="password"
                    value={formik.values.confirmPassword}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.confirmPassword && Boolean(formik.errors.confirmPassword)}
                    helperText={formik.touched.confirmPassword && formik.errors.confirmPassword}
                />
                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                    <Button
                        variant="contained"
                        type="submit"
                        disabled={!formik.isValid || formik.isSubmitting}
                        sx={{
                            opacity: (!formik.isValid || formik.isSubmitting) ? 0.6 : 1,
                            cursor: (!formik.isValid || formik.isSubmitting) ? 'not-allowed' : 'pointer',
                            transition: 'opacity 0.3s ease'
                        }}
                    >
                        {formik.isSubmitting ? 'Registering...' : 'Register'}
                    </Button>
                    <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => navigate('/admin-dashboard')}
                    >
                        Cancel
                    </Button>
                </Box>
            </Box>
            <ToastContainer />
        </Box>
    );
}

export default CreateAdminForm;