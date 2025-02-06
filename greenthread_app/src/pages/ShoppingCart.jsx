import React, { useContext, useEffect, useState } from "react";
import { Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Paper } from "@mui/material";
import http from "../http";
import UserContext from "../contexts/UserContext";
import { ToastContainer, toast } from "react-toastify";
import { useNavigate } from "react-router-dom"; 
import "react-toastify/dist/ReactToastify.css";

function ShoppingCart() {
    const { user } = useContext(UserContext);
    const [cartItems, setCartItems] = useState([]);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (user) {
            fetchCart();
        }
    }, [user]);

    const fetchCart = async () => {
        try {
            const response = await http.get(`/api/ShoppingCart`);
            const userCartItems = response.data.filter((item) => item.userID === user.userID);
            setCartItems(userCartItems);
        } catch (err) {
            setError("Failed to load shopping cart.");
        } finally {
            setLoading(false);
        }
    };

    const updateQuantity = async (id, newQuantity) => {
        if (newQuantity < 1) {
            toast.error("Quantity must be at least 1.");
            return;
        }
        try {
            await http.put(`/api/ShoppingCart/${id}`, newQuantity, {
                headers: { "Content-Type": "application/json" }
            });
            toast.success("Quantity updated successfully.");
            fetchCart();
        } catch (err) {
            toast.error("Failed to update quantity.");
        }
    };

    const removeItem = async (id) => {
        try {
            await http.delete(`/api/ShoppingCart/${id}`);
            toast.success("Item removed successfully.");
            fetchCart();
        } catch (err) {
            toast.error("Failed to remove item.");
        }
    };

    const checkout = async () => {
        try {
            const response = await http.post(`/api/ShoppingCart/${user.userID}/checkout`, {
                address: "123 Street, City", // Replace with user input
                phoneNumber: "1234567890",
                paymentMethod: "Credit Card"
            });
            toast.success(response.data.message);
            fetchCart();

            navigate("/create-payment")
        } catch (err) {
            toast.error("Checkout failed.");
        }
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p className="error">{error}</p>;

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
                        Grand Total: ${cartItems.reduce((acc, item) => acc + item.quantity * item.product.price, 0).toFixed(2)}
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
