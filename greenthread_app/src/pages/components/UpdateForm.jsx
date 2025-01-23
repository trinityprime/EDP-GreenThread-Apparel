import React, { useState, useEffect } from 'react';
import { Box, Typography, TextField, Button } from '@mui/material';
import http from '../../http';
import { useNavigate, useParams } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import PropTypes from 'prop-types';
import * as yup from 'yup';
import { useFormik } from 'formik';

// Validation schema for user
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
    postalCode: yup.string().trim()
        .length(6, 'Postal Code must be exactly 6 characters')
        .matches(/^\d{6}$/, 'Postal Code must be a valid 6-digit number')
        .required('Postal Code is required')
});

// Validation schema for admin
const adminValidationSchema = yup.object({
    email: yup.string().trim()
        .email('Enter a valid email')
        .max(50, 'Email must be at most 50 characters')
        .required('Email is required')
});

function UpdateForm({ type }) {
    const { id } = useParams();
    const navigate = useNavigate();
    const [initialValues, setInitialValues] = useState({
        firstName: '',
        lastName: '',
        email: '',
        postalCode: ''
    });

    // Use the appropriate validation schema based on the type
    const validationSchema = type === 'user' ? userValidationSchema : adminValidationSchema;

    const formik = useFormik({
        initialValues: initialValues,
        validationSchema: validationSchema,
        onSubmit: (data) => {
            // Prepare data to send based on type
            const payload = type === 'user' ? {
                firstName: data.firstName.trim(),
                lastName: data.lastName.trim(),
                email: data.email.trim().toLowerCase(),
                postalCode: data.postalCode.trim()
            } : {
                email: data.email.trim().toLowerCase()
            };

            http.put(`/${type}/${id}`, payload)
                .then(() => {
                    toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully.`);
                    navigate('/admin-dashboard');
                })
                .catch((err) => {
                    toast.error(`Failed to update ${type}.`);
                    console.error(`Error updating ${type}:`, err);
                });
        },
        enableReinitialize: true // Allow reinitialization when initialValues change
    });

    useEffect(() => {
        // Fetch user or admin data based on type
        http.get(`/${type}/${id}`)
            .then((res) => {
                const data = res.data;
                setInitialValues({
                    firstName: data.firstName || '',
                    lastName: data.lastName || '',
                    email: data.email || '',
                    postalCode: data.postalCode || ''
                });
            })
            .catch((err) => {
                toast.error(`Failed to fetch ${type} data.`);
                console.error(`Error fetching ${type}:`, err);
            });
    }, [id, type]);

    return (
        <Box sx={{ mt: 4, mx: 'auto', maxWidth: '500px' }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
                Update {type.charAt(0).toUpperCase() + type.slice(1)}
            </Typography>
            <Box component="form" onSubmit={formik.handleSubmit}>
                {type === 'user' && (
                    <>
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
                    </>
                )}
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
                {type === 'user' && (
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
                )}
                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
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
                        color="secondary"
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

// Add PropTypes validation
UpdateForm.propTypes = {
    type: PropTypes.oneOf(['user', 'admin']).isRequired // Validate that `type` is either 'user' or 'admin'
};

export default UpdateForm;