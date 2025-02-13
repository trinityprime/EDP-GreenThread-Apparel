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
    const [cartItems, setCartItems] = useState([]); // This will store the cart items
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
            const response = await http.get(`/api/ShoppingCart`);
            const userCartItems = response.data.filter((item) => item.userID === user.userID);

            if (userCartItems.length > 0) {
                setCartItems(userCartItems); // Update cart items state
                const total = userCartItems.reduce((acc, item) => acc + item.quantity * item.product.price, 0);
                setCartTotal(total); // Update total
            } else {
                setCartItems([]); // Clear cart items if empty
                setCartTotal(0);
                toast.error("Your shopping cart is empty.");
            }
        } catch (err) {
            setError("Failed to load shopping cart.");
            console.error(err);
        } finally {
            setLoading(false); // Set loading to false after fetching
        }
    };

    const updateQuantity = async (id, newQuantity) => {
        if (newQuantity < 1) {
            toast.error("Quantity must be at least 1.");
            return;
        }
        try {
            await http.put(`/api/ShoppingCart/${id}`, { quantity: newQuantity }, {
                headers: { "Content-Type": "application/json" },
            });
            toast.success("Quantity updated successfully.");
            fetchCart(); // Refresh cart after updating quantity
        } catch (err) {
            toast.error("Failed to update quantity.");
        }
    };

    const removeItem = async (id) => {
        try {
            await http.delete(`/api/ShoppingCart/${id}`);
            toast.success("Item removed successfully.");
            fetchCart(); // Refresh cart after removing item
        } catch (err) {
            toast.error("Failed to remove item.");
        }
    };

    const checkout = async () => {
        if (cartItems.length === 0) {
            toast.error("Your cart is empty.");
            return;
        }
        try {
            toast.success("Redirecting to payment...");
            navigate("/create-payment"); // Navigate to payment screen
        } catch (err) {
            toast.error("Checkout failed.");
        }
    };

    if (loading) return <Typography>Loading...</Typography>;
    if (error) return <Typography color="error">{error}</Typography>;

    return (
        <Box sx={{ mt: 4, mx: "auto", maxWidth: "800px" }}>
            <Typography variant="h5" sx={{ mb: 2 }}>Shopping Cart</Typography>
            {cartItems.length === 0 ? (
                <Typography>Your cart is empty.</Typography>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Product</TableCell>
                                <TableCell>Price</TableCell>
                                <TableCell>Quantity</TableCell>
                                <TableCell>Total</TableCell>
                                <TableCell>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {cartItems.map((item) => (
                                <TableRow key={item.shoppingCartID}>
                                    <TableCell>{item.product.name}</TableCell>
                                    <TableCell>${item.product.price.toFixed(2)}</TableCell>
                                    <TableCell>
                                        <TextField
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => updateQuantity(item.shoppingCartID, parseInt(e.target.value))}
                                            size="small"
                                            sx={{ width: "60px" }}
                                        />
                                    </TableCell>
                                    <TableCell>${(item.quantity * item.product.price).toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Button color="error" onClick={() => removeItem(item.shoppingCartID)}>Remove</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
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
