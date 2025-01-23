import React, { useEffect, useContext, useState } from 'react';
import { Box, Typography, TextField, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as yup from 'yup';
import http from '../../http';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import UserContext from '../../contexts/UserContext';

// Validation schema for user registration
const userValidationSchema = yup.object({
    firstName: yup.string().trim()
        .min(3, 'First Name must be at least 3 characters')
        .max(50, 'First Name must be at most 50 characters')
        .matches(/^[A-Za-z]+$/, 'First Name can only contain letters')
        .required('First Name is required'),
    lastName: yup.string().trim()
        .min(3, 'Last Name must be at least 3 characters')
        .max(50, 'Last Name must be at most 50 characters')
        .matches(/^[A-Za-z]+$/, 'Last Name can only contain letters')
        .required('Last Name is required'),
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
        .required('Confirm Password is required'),
    postalCode: yup.string().trim()
        .length(6, 'Postal Code must be exactly 6 characters')
        .matches(/^\d{6}$/, 'Postal Code must be a valid 6-digit number')
        .required('Postal Code is required')
});

function CreateUserForm() {
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
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            confirmPassword: '',
            postalCode: ''
        },
        validationSchema: userValidationSchema,
        onSubmit: (data) => {
            data.firstName = data.firstName.trim();
            data.lastName = data.lastName.trim();
            data.email = data.email.trim().toLowerCase();
            data.password = data.password.trim();
            data.postalCode = data.postalCode.trim();

            http.post('/user/register', data)
                .then(() => {
                    toast.success('User registered successfully.');
                    navigate('/admin-dashboard');
                })
                .catch((err) => {
                    toast.error(err.response?.data?.message || 'Failed to register user.');
                    console.error('Error registering user:', err);
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
                Create User
            </Typography>
            <Box component="form" onSubmit={formik.handleSubmit}>
                <TextField
                    fullWidth margin="dense" autoComplete="off"
                    label="First Name"
                    name="firstName"
                    value={formik.values.firstName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.firstName && Boolean(formik.errors.firstName)}
                    helperText={formik.touched.firstName && formik.errors.firstName}
                />
                <TextField
                    fullWidth margin="dense" autoComplete="off"
                    label="Last Name"
                    name="lastName"
                    value={formik.values.lastName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.lastName && Boolean(formik.errors.lastName)}
                    helperText={formik.touched.lastName && formik.errors.lastName}
                />
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
                <TextField
                    fullWidth margin="dense" autoComplete="off"
                    label="Postal Code"
                    name="postalCode"
                    value={formik.values.postalCode}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.postalCode && Boolean(formik.errors.postalCode)}
                    helperText={formik.touched.postalCode && formik.errors.postalCode}
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

export default CreateUserForm;