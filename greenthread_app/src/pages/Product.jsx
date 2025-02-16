import React, { useEffect, useState, useContext } from "react";
import { Box, Typography, Grid, Card, CardMedia, CardContent, CardActions, Button, TextField } from "@mui/material";
import http from "../http";
import UserContext from "../contexts/UserContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Product() {
    const { user } = useContext(UserContext);
    const [products, setProducts] = useState([]);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetchProducts();
    }, [search]);

    const fetchProducts = async () => {
        try {
            const response = await http.get(`/api/Product?search=${search}`);
            setProducts(response.data);
        } catch {
            toast.error("Failed to load products.");
        }
    };

    const addToCart = async (product) => {
        if (!user) {
            toast.error("You must be logged in to add items to the cart.");
            return;
        }

        try {
            await http.post("/api/ShoppingCart", {
                userID: user.userID,
                productID: product.productID,
                quantity: 1, // Default to adding 1 item
            });

            toast.success(`${product.productName} added to cart!`);
        } catch (err) {
            console.error(err);
            toast.error("Failed to add the product to the cart. Please try again.");
        }
    };


    return (
        <Box sx={{ maxWidth: "1200px", mx: "auto", mt: 4 }}>
            <Typography variant="h4" sx={{ mb: 2 }}>Products</Typography>
            <TextField
                fullWidth
                placeholder="Search products..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                sx={{ mb: 3 }}
            />
            <Grid container spacing={3}>
                {products.length === 0 ? (
                    <Typography variant="h6" sx={{ mx: "auto", mt: 4 }}>
                        No products available.
                    </Typography>
                ) : (
                    products.map((product) => {
                        const finalPrice = product.price * (1 - (product.discountPercentage / 100));
                        return (
                            <Grid item key={product.productID} xs={12} sm={6} md={4}>
                                <Card>
                                    <CardMedia
                                        component="img"
                                        height="200"
                                        image={product.imageFiles?.[0] || "/default-image.jpg"} // Fallback image
                                        alt={product.productName || "Product"}
                                    />
                                    <CardContent>
                                        <Typography variant="h6">{product.productName}</Typography>
                                        <Typography variant="body2">{product.productDescription}</Typography>
                                        <Typography variant="body1" sx={{ mt: 1, fontWeight: "bold" }}>
                                            ${finalPrice.toFixed(2)}
                                        </Typography>
                                    </CardContent>
                                    <CardActions>
                                        <Button variant="contained" onClick={() => addToCart(product)}>
                                            Add to Cart
                                        </Button>
                                    </CardActions>
                                </Card>
                            </Grid>
                        );
                    })
                )}
            </Grid>
            <ToastContainer />
        </Box>
    );
}

export default Product;
