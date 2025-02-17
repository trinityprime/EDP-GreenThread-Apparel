import React, { useState, useEffect } from "react";
import { Box, Typography, TextField, Button, Select, MenuItem, InputLabel, FormControl } from "@mui/material";
import http from "../../http";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useParams, useNavigate } from "react-router-dom";

function UpdateProductForm() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState({
        productName: "",
        productDescription: "",
        price: "",
        stock: "",
        size: "",
        discountPercentage: 0,
        category: "",
    });
    const [images, setImages] = useState(null);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await http.get(`/api/Product/${id}`);
                setProduct(response.data);
            } catch (error) {
                toast.error("Failed to load product data.");
            }
        };
        fetchProduct();
    }, [id]);

    const handleChange = (e) => {
        setProduct({ ...product, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        const files = e.target.files;
        setImages(files.length > 0 ? files : null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!product.productName || !product.productDescription || !product.price || !product.stock || !product.size || !product.category) {
            toast.error("All fields except images are required.");
            return;
        }

        const formData = new FormData();
        Object.keys(product).forEach((key) => {
            formData.append(key, product[key]);
        });

        if (images) {
            for (let i = 0; i < images.length; i++) {
                formData.append("imageFiles", images[i]);
            }
        }

        try {
            await http.put(`/api/Product/${id}`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            toast.success("Product updated successfully!");
            navigate("/admin-dashboard");
        } catch (error) {
            toast.error("Failed to update product.");
        }
    };

    return (
        <Box>
            <Typography variant="h4" gutterBottom>Update Product</Typography>
            <form onSubmit={handleSubmit}>
                <TextField label="Product Name" name="productName" fullWidth margin="normal" value={product.productName} onChange={handleChange} required />
                <TextField label="Description" name="productDescription" fullWidth margin="normal" value={product.productDescription} onChange={handleChange} required />
                <TextField label="Price" name="price" type="number" fullWidth margin="normal" value={product.price} onChange={handleChange} required />
                <TextField label="Stock" name="stock" type="number" fullWidth margin="normal" value={product.stock} onChange={handleChange} required />
                <FormControl fullWidth margin="normal">
                    <InputLabel>Size</InputLabel>
                    <Select name="size" value={product.size} onChange={handleChange} required>
                        <MenuItem value="S">S</MenuItem>
                        <MenuItem value="M">M</MenuItem>
                        <MenuItem value="L">L</MenuItem>
                        <MenuItem value="XL">XL</MenuItem>
                        <MenuItem value="XXL">XXL</MenuItem>
                    </Select>
                </FormControl>
                <TextField label="Discount Percentage" name="discountPercentage" type="number" fullWidth margin="normal" value={product.discountPercentage} onChange={handleChange} />
                <FormControl fullWidth margin="normal">
                    <InputLabel>Category</InputLabel>
                    <Select name="category" value={product.category} onChange={handleChange} required>
                        <MenuItem value="Shirt">Shirt</MenuItem>
                        <MenuItem value="Pants">Pants</MenuItem>
                        <MenuItem value="Dresses">Dresses</MenuItem>
                        <MenuItem value="Shoes">Shoes</MenuItem>
                        <MenuItem value="Blouse">Blouse</MenuItem>
                    </Select>
                </FormControl>
                <input type="file" multiple onChange={handleImageChange} />
                <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>Update Product</Button>
            </form>
            <ToastContainer />
        </Box>
    );
}

export default UpdateProductForm;
