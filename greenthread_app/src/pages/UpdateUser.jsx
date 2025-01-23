import React, { useState, useContext } from 'react';
import { Box, TextField, Button, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from '../http';
import UserContext from '../contexts/UserContext';
import { ToastContainer, toast } from 'react-toastify';
import { useFormik } from 'formik';
import * as yup from 'yup';
import 'react-toastify/dist/ReactToastify.css';

function UpdateUser() {
    const { user, setUser } = useContext(UserContext);
    const navigate = useNavigate();

    const validationSchema = yup.object({
        firstName: yup.string().trim()
            .min(3, 'First Name must be at least 3 characters')
            .max(50, 'First Name must be at most 50 characters')
            .required('First Name is required'),
        lastName: yup.string().trim()
            .min(3, 'Last Name must be at least 3 characters')
            .max(50, 'Last Name must be at most 50 characters')
            .required('Last Name is required'),
        email: yup.string().trim()
            .email('Enter a valid email')
            .max(50, 'Email must be at most 50 characters')
            .required('Email is required'),
        postalCode: yup.string().trim()
            .length(6, 'Postal Code must be exactly 6 characters')
            .matches(/^\d{6}$/, 'Postal Code must be a valid 6-digit number')
            .required('Postal Code is required')
    });

    const formik = useFormik({
        initialValues: {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            postalCode: user.postalCode
        },
        validationSchema,
        onSubmit: async (values) => {
            try {
                await axios.put(`/user/${user.userID}`, values);
                setUser({ ...user, ...values });
                toast.success('Profile updated successfully');
                navigate('/profile');
            } catch (error) {
                toast.error('Error updating user');
                console.error('Error updating user:', error);
            }
        }
    });

    const handleCancel = () => {
        navigate('/profile'); 
    };

    return (
        <Box sx={{ mt: 4, mx: 'auto', maxWidth: '500px' }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
                Update Profile
            </Typography>
            <form onSubmit={formik.handleSubmit}>
                <TextField
                    label="First Name"
                    name="firstName"
                    value={formik.values.firstName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.firstName && Boolean(formik.errors.firstName)}
                    helperText={formik.touched.firstName && formik.errors.firstName}
                    fullWidth
                    sx={{ mb: 2 }}
                />
                <TextField
                    label="Last Name"
                    name="lastName"
                    value={formik.values.lastName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.lastName && Boolean(formik.errors.lastName)}
                    helperText={formik.touched.lastName && formik.errors.lastName}
                    fullWidth
                    sx={{ mb: 2 }}
                />
                <TextField
                    label="Email"
                    name="email"
                    value={formik.values.email}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.email && Boolean(formik.errors.email)}
                    helperText={formik.touched.email && formik.errors.email}
                    fullWidth
                    sx={{ mb: 2 }}
                />
                <TextField
                    label="Postal Code"
                    name="postalCode"
                    value={formik.values.postalCode}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.postalCode && Boolean(formik.errors.postalCode)}
                    helperText={formik.touched.postalCode && formik.errors.postalCode}
                    fullWidth
                    sx={{ mb: 2 }}
                />
                <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        disabled={!formik.isValid || formik.isSubmitting}
                        sx={{
                            opacity: (!formik.isValid || formik.isSubmitting) ? 0.6 : 1,
                            cursor: (!formik.isValid || formik.isSubmitting) ? 'not-allowed' : 'pointer',
                            transition: 'opacity 0.3s ease'
                        }}
                    >
                        {formik.isSubmitting ? 'Saving...' : 'Save'}
                    </Button>
                    <Button
                        type="button"
                        variant="outlined"
                        color="secondary"
                        onClick={handleCancel} 
                    >
                        Cancel
                    </Button>
                </Box>
            </form>
            <ToastContainer />
        </Box>
    );
}

export default UpdateUser;
