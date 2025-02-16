import React, { useContext, useEffect, useState } from "react";
import { Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Paper } from "@mui/material";
import http from "../http";
import UserContext from "../contexts/UserContext";
import { ToastContainer, toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";

function ShoppingCart() {
    const { user } = useContext(UserContext);
    const [cartTotal, setCartTotal] = useState(0);
    const [cartItems, setCartItems] = useState([]); // Store cart items
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true); // Controls loading state
    const [error, setError] = useState(""); // Stores error messages

    useEffect(() => {
        if (user) {
            fetchCart();
        }
    }, [user]);

    const fetchCart = async () => {
        try {
            const response = await http.get(`/api/ShoppingCart/${user.userID}`);
            const cartItems = response.data || []; // Get items directly from API response

            if (cartItems.length > 0) {
                setCartItems(cartItems);

                // Calculate grand total based on discounted prices
                const total = cartItems.reduce(
                    (acc, item) => acc + item.quantity * (item.productPrice * (1 - item.discount / 100)),
                    0
                );
                setCartTotal(total);
            } else {
                // New cart is created but empty
                setCartItems([]);
                setCartTotal(0);
            }
        } catch (err) {
            // Handle errors other than empty cart
            console.error("Failed to load shopping cart:", err);
            toast.error("Failed to load shopping cart. Please try again later.");
        } finally {
            setLoading(false); // Ensure loading state is updated
        }
    };


    const updateQuantity = async (itemId, newQuantity) => {
        console.log(`Updating quantity for itemId: ${itemId}, New Quantity: ${newQuantity}`);
        if (newQuantity < 1) {
            toast.error("Quantity must be at least 1.");
            return;
        }
        try {
            // Adjusted route for nested structure
            await http.put(`/api/ShoppingCart/${user.userID}/item/${itemId}`, { quantity: newQuantity });
            toast.success("Quantity updated successfully.");
            fetchCart();
        } catch (err) {
            console.error("Failed to update quantity:", err);
            toast.error("Failed to update quantity.");
        }
    };

    const removeItem = async (itemId) => {
        console.log(`Removing item with itemId: ${itemId}`);
        try {
            // Adjusted route for nested structure
            await http.delete(`/api/ShoppingCart/${user.userID}/item/${itemId}`);
            toast.success("Item removed successfully.");
            fetchCart();
        } catch (err) {
            console.error("Failed to remove item:", err);
            toast.error("Failed to remove item.");
        }
    };

    const checkout = async () => {
        if (cartItems.length === 0) {
            toast.error("Your cart is empty.");
            return;
        }

        try {
            // Prepare data to pass to the payment form
            const cartSummary = {
                userID: user.userID,
                cartItems,
                cartTotal,
            };

            // Save cart summary in localStorage or navigate state (React Router)
            localStorage.setItem("cartSummary", JSON.stringify(cartSummary));

            // Navigate to the payment form
            navigate("/create-payment");
        } catch (err) {
            console.error("Checkout failed:", err);
            toast.error("Checkout failed. Please try again.");
        }
    };

    if (loading) {
        return (
            <Box sx={{ mt: 4, mx: "auto", maxWidth: "800px", textAlign: "center" }}>
                <Typography>Loading your cart...</Typography>
            </Box>
        );
    }

    if (error) {
        return (
            <Box sx={{ mt: 4, mx: "auto", maxWidth: "800px", textAlign: "center" }}>
                <Typography color="error">{error}</Typography>
            </Box>
        );
    }


    return (
        <Box sx={{ mt: 4, mx: "auto", maxWidth: "800px" }}>
            <Typography variant="h5" sx={{ mb: 2 }}>Shopping Cart</Typography>
            {cartItems.length === 0 ? (
                <Typography>Your cart is empty, consider adding a product!</Typography>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Product</TableCell>
                                <TableCell>Original Price</TableCell>
                                <TableCell>Discount %</TableCell>

                                <TableCell>Discounted Price</TableCell>
                                <TableCell>Quantity</TableCell>
                                <TableCell>Total</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {cartItems.map((item) => {
                                const discount = item.discount || 0; // Use flat discount field
                                const discountedPrice = item.productPrice * (1 - discount / 100); // Use flat productPrice field

                                return (
                                    <TableRow key={item.shoppingCartItemID}>
                                        <TableCell>{item.productName || "Unknown Product"}</TableCell>
                                        <TableCell>${item.productPrice?.toFixed(2) || "0.00"}</TableCell>
                                        <TableCell>{item.discount?.toFixed(2) || "0.00"}%</TableCell>
                                        <TableCell>${discountedPrice.toFixed(2)}</TableCell>
                                        <TableCell>
                                            <TextField
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) =>
                                                    updateQuantity(item.shoppingCartItemID, parseInt(e.target.value))
                                                }
                                                size="small"
                                                sx={{ width: "60px" }}
                                            />
                                        </TableCell>
                                        <TableCell>${(item.quantity * discountedPrice).toFixed(2)}</TableCell>
                                        <TableCell>
                                            <Button
                                                color="error"
                                                onClick={() => removeItem(item.shoppingCartItemID)}
                                            >
                                                Remove
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
            {cartItems.length > 0 && (
                <>
                    <Typography variant="h6" sx={{ mt: 2 }}>
                        Grand Total: ${cartTotal.toFixed(2)}
                    </Typography>
                    <Button variant="contained" color="primary" sx={{ mt: 2 }} onClick={checkout}>
                        Checkout
                    </Button>
                </>
            )}
            <ToastContainer />
        </Box>
    );
}

export default ShoppingCart;
