import React, { useEffect, useContext, useState } from 'react';
import { Box, Typography, TextField, Button, MenuItem } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as yup from 'yup';
import http from '../../http';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import UserContext from '../../contexts/UserContext';

// Define product sizes and statuses
const productSizes = ['S', 'M', 'L', 'XL', 'XXL'];
const productStatuses = ['Active', 'OutOfStock', 'Discontinued'];

// Validation schema
const productValidationSchema = yup.object({
    productName: yup.string().trim()
        .min(3, 'Product Name must be at least 3 characters')
        .max(100, 'Product Name must be at most 100 characters')
        .required('Product Name is required'),
    productDescription: yup.string().trim()
        .min(3, 'Description must be at least 3 characters')
        .max(500, 'Description must be at most 500 characters')
        .required('Product Description is required'),
    price: yup.number()
        .min(0.01, 'Price must be greater than 0')
        .required('Price is required'),
    stock: yup.number()
        .min(0, 'Stock cannot be negative')
        .required('Stock is required'),
    size: yup.string()
        .oneOf(productSizes, 'Invalid product size')
        .required('Size is required'),
    discountPercentage: yup.number()
        .min(0, 'Discount cannot be negative')
        .max(100, 'Discount cannot exceed 100%')
        .required('Discount Percentage is required'),
    productCategoryID: yup.number()
        .required('Product Category is required'),
    status: yup.string()
        .oneOf(productStatuses, 'Invalid status')
        .required('Product Status is required'),
    imageFiles: yup.mixed()
});

function CreateProduct() {
    const { user } = useContext(UserContext);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [categories, setCategories] = useState([]);
    const [selectedImages, setSelectedImages] = useState([]);

    useEffect(() => {
        if (user && user.role === 'Admin') {
            setLoading(false);
            fetchCategories();
        } else {
            toast.error("You do not have admin permissions.");
            navigate('/not-authorized');
        }
    }, [user, navigate]);

    // Fetch product categories
    const fetchCategories = async () => {
        try {
            const response = await http.get('/productcategories');
            setCategories(response.data);
        } catch (error) {
            toast.error("Failed to fetch product categories.");
        }
    };

    const handleFileChange = (event) => {
        const files = Array.from(event.target.files);
        setSelectedImages(files);
    };

    const formik = useFormik({
        initialValues: {
            productName: '',
            productDescription: '',
            price: '',
            stock: '',
            size: '',
            discountPercentage: 0,
            productCategoryID: '',
            status: 'Active',
            imageFiles: null
        },
        validationSchema: productValidationSchema,
        onSubmit: async (values) => {
            try {
                const formData = new FormData();
                formData.append('productName', values.productName.trim());
                formData.append('productDescription', values.productDescription.trim());
                formData.append('price', values.price);
                formData.append('stock', values.stock);
                formData.append('size', values.size);
                formData.append('discountPercentage', values.discountPercentage);
                formData.append('productCategoryID', values.productCategoryID);
                formData.append('status', values.status);

                selectedImages.forEach(file => {
                    formData.append('imageFiles', file);
                });

                await http.post('/product', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });

                toast.success('Product created successfully.');
                navigate('/admin-dashboard');
            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to create product.');
            }
        }
    });

    if (loading) {
        return <Typography>Loading...</Typography>;
    }

    return (
        <Box sx={{ mt: 4, mx: 'auto', maxWidth: '600px' }}>
            <Typography variant="h5" sx={{ mb: 2 }}>Create Product</Typography>
            <Box component="form" onSubmit={formik.handleSubmit} encType="multipart/form-data">
                <TextField
                    fullWidth margin="dense" autoComplete="off"
                    label="Product Name"
                    name="productName"
                    value={formik.values.productName}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.productName && Boolean(formik.errors.productName)}
                    helperText={formik.touched.productName && formik.errors.productName}
                />
                <TextField
                    fullWidth margin="dense" autoComplete="off"
                    label="Product Description"
                    name="productDescription"
                    multiline
                    rows={3}
                    value={formik.values.productDescription}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.productDescription && Boolean(formik.errors.productDescription)}
                    helperText={formik.touched.productDescription && formik.errors.productDescription}
                />
                <TextField
                    fullWidth margin="dense" autoComplete="off"
                    label="Price"
                    name="price"
                    type="number"
                    value={formik.values.price}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.price && Boolean(formik.errors.price)}
                    helperText={formik.touched.price && formik.errors.price}
                />
                <TextField
                    fullWidth margin="dense" autoComplete="off"
                    label="Stock"
                    name="stock"
                    type="number"
                    value={formik.values.stock}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.stock && Boolean(formik.errors.stock)}
                    helperText={formik.touched.stock && formik.errors.stock}
                />
                <TextField
                    fullWidth margin="dense" select
                    label="Size"
                    name="size"
                    value={formik.values.size}
                    onChange={formik.handleChange}
                    error={formik.touched.size && Boolean(formik.errors.size)}
                    helperText={formik.touched.size && formik.errors.size}
                >
                    {productSizes.map(size => (
                        <MenuItem key={size} value={size}>{size}</MenuItem>
                    ))}
                </TextField>
                <TextField
                    fullWidth margin="dense" autoComplete="off"
                    label="Discount Percentage"
                    name="discountPercentage"
                    type="number"
                    value={formik.values.discountPercentage}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.discountPercentage && Boolean(formik.errors.discountPercentage)}
                    helperText={formik.touched.discountPercentage && formik.errors.discountPercentage}
                />
                <TextField
                    fullWidth margin="dense" select
                    label="Product Category"
                    name="productCategoryID"
                    value={formik.values.productCategoryID}
                    onChange={formik.handleChange}
                    error={formik.touched.productCategoryID && Boolean(formik.errors.productCategoryID)}
                    helperText={formik.touched.productCategoryID && formik.errors.productCategoryID}
                >
                    {categories.map(category => (
                        <MenuItem key={category.productCategoryID} value={category.productCategoryID}>
                            {category.productCategoryName}
                        </MenuItem>
                    ))}
                </TextField>
                <TextField
                    fullWidth margin="dense" select
                    label="Product Status"
                    name="status"
                    value={formik.values.status}
                    onChange={formik.handleChange}
                    error={formik.touched.status && Boolean(formik.errors.status)}
                    helperText={formik.touched.status && formik.errors.status}
                >
                    {productStatuses.map(status => (
                        <MenuItem key={status} value={status}>{status}</MenuItem>
                    ))}
                </TextField>
                <input type="file" multiple onChange={handleFileChange} />
                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                    <Button variant="contained" type="submit">Create Product</Button>
                    <Button variant="outlined" onClick={() => navigate('/admin-dashboard')}>Cancel</Button>
                </Box>
            </Box>
            <ToastContainer />
        </Box>
    );
}

export default CreateProduct;
