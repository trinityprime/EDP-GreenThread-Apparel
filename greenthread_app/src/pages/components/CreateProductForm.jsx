import React, { useState, useEffect } from "react";
import { Box, Typography, TextField, Button, Select, MenuItem, InputLabel, FormControl } from "@mui/material";
import http from "../../http";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function CreateProductForm() {
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

    const handleChange = (e) => {
        setProduct({ ...product, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        const files = e.target.files;
        setImages(files.length > 0 ? files : null); // Reset if no file is chosen
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!product.productName || !product.productDescription || !product.price || !product.stock || !product.size || !product.category) {
            toast.error("All fields except images are required.");
            return;
        }

        // ✅ Use FormData for multipart/form-data
        const formData = new FormData();
        formData.append("productName", product.productName);
        formData.append("productDescription", product.productDescription);
        formData.append("price", product.price);
        formData.append("stock", product.stock);
        formData.append("size", product.size);
        formData.append("discountPercentage", product.discountPercentage);
        formData.append("status", "Active"); // Default status
        formData.append("category", product.category); // Enum category

        if (images) {
            for (let i = 0; i < images.length; i++) {
                formData.append("imageFiles", images[i]);
            }
        }

        try {
            await http.post("/api/Product", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });
            toast.success("Product added successfully!");
            setProduct({
                productName: "",
                productDescription: "",
                price: "",
                stock: "",
                size: "",
                discountPercentage: 0,
                category: "",
            });
            setImages(null);
        } catch {
            toast.error("Failed to add product.");
        }
    };

    return (
        <Box sx={{ maxWidth: 600, mx: "auto", mt: 4, p: 2 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>Create Product</Typography>
            <form onSubmit={handleSubmit}>
                <TextField fullWidth label="Product Name" name="productName" value={product.productName} onChange={handleChange} sx={{ mb: 2 }} />
                <TextField fullWidth multiline rows={3} label="Description" name="productDescription" value={product.productDescription} onChange={handleChange} sx={{ mb: 2 }} />
                <TextField fullWidth type="number" label="Price ($)" name="price" value={product.price} onChange={handleChange} sx={{ mb: 2 }} />
                <TextField fullWidth type="number" label="Stock" name="stock" value={product.stock} onChange={handleChange} sx={{ mb: 2 }} />

                <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Size</InputLabel>
                    <Select name="size" value={product.size} onChange={handleChange}>
                        <MenuItem value="S">S</MenuItem>
                        <MenuItem value="M">M</MenuItem>
                        <MenuItem value="L">L</MenuItem>
                        <MenuItem value="XL">XL</MenuItem>
                        <MenuItem value="XXL">XXL</MenuItem>
                    </Select>
                </FormControl>

                <TextField fullWidth type="number" label="Discount %" name="discountPercentage" value={product.discountPercentage} onChange={handleChange} sx={{ mb: 2 }} />

                <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Category</InputLabel>
                    <Select name="category" value={product.category} onChange={handleChange}>
                        <MenuItem value="Shirt">Shirt</MenuItem>
                        <MenuItem value="Pants">Pants</MenuItem>
                        <MenuItem value="Dresses">Dresses</MenuItem>
                        <MenuItem value="Shoes">Shoes</MenuItem>
                        <MenuItem value="Blouse">Blouse</MenuItem>
                    </Select>
                </FormControl>

                {/* ✅ Image Uploads (Optional) */}
                <input type="file" multiple onChange={handleImageChange} accept="image/*" style={{ marginBottom: "16px" }} />

                <Button fullWidth type="submit" variant="contained">Add Product</Button>
            </form>
            <ToastContainer />
        </Box>
    );
}

export default CreateProductForm;
