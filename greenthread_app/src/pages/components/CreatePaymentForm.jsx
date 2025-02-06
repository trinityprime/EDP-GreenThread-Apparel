import React, { useState, useContext, useEffect } from "react";
import { Box, Typography, TextField, Button, MenuItem, Select, InputLabel, FormControl } from "@mui/material";
import { useNavigate } from "react-router-dom";
import http from "../../http";
import UserContext from "../../contexts/UserContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function CreatePaymentForm() {
    const { user } = useContext(UserContext);
    const navigate = useNavigate();

    const [paymentDetails, setPaymentDetails] = useState({
        address: "",
        phoneNumber: "",
        paymentMethod: "Credit Card",
    });

    const [shoppingCartID, setShoppingCartID] = useState(null);
    const [cartTotal, setCartTotal] = useState(0);

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
                setShoppingCartID(userCartItems[0].shoppingCartID);
                setCartTotal(userCartItems.reduce((acc, item) => acc + item.quantity * item.product.price, 0));
            }
        } catch {
            toast.error("Failed to load shopping cart.");
        }
    };

    const handleChange = (e) => {
        setPaymentDetails({ ...paymentDetails, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!paymentDetails.address || !paymentDetails.phoneNumber) {
            toast.error("Please fill in all required fields.");
            return;
        }

        try {
            // **Check if payment already exists**
            const existingPayment = await http.get(`/api/Payment`);
            const userPayments = existingPayment.data.filter((p) => p.userID === user.userID && p.shoppingCartID === shoppingCartID);

            if (userPayments.length > 0) {
                toast.info("Payment already exists. Redirecting to orders...");
                setTimeout(() => navigate("/orders"), 2000);
                return;
            }

            // **Proceed with creating the payment**
            const response = await http.post("/api/Payment", {
                userID: user.userID,
                shoppingCartID: shoppingCartID,
                address: paymentDetails.address,
                phoneNumber: paymentDetails.phoneNumber,
                paymentMethod: paymentDetails.paymentMethod,
                amountPaid: cartTotal,
            });

            toast.success(`Payment successful! Redirecting to orders...`);
            setTimeout(() => navigate("/orders"), 2000);
        } catch (error) {
            if (error.response && error.response.status === 409) {
                toast.info("Payment already exists. Redirecting to orders...");
                setTimeout(() => navigate("/orders"), 2000);
            } else {
                toast.error("Payment failed. Please try again.");
            }
        }
    };

    return (
        <Box sx={{ maxWidth: "600px", mx: "auto", mt: 4, p: 2 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>Enter Payment Details</Typography>
            <form onSubmit={handleSubmit}>
                <TextField fullWidth label="Address" name="address" value={paymentDetails.address} onChange={handleChange} sx={{ mb: 2 }} required />
                <TextField fullWidth label="Phone Number" name="phoneNumber" value={paymentDetails.phoneNumber} onChange={handleChange} sx={{ mb: 2 }} required />
                <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Payment Method</InputLabel>
                    <Select name="paymentMethod" value={paymentDetails.paymentMethod} onChange={handleChange}>
                        <MenuItem value="Credit Card">Credit Card</MenuItem>
                        <MenuItem value="PayPal">PayPal</MenuItem>
                        <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                    </Select>
                </FormControl>

                <Typography variant="h6" sx={{ mb: 2 }}>Grand Total: ${cartTotal.toFixed(2)}</Typography>

                <Button fullWidth type="submit" variant="contained" color="primary">Proceed to Payment</Button>
            </form>
            <ToastContainer />
        </Box>
    );
}

export default CreatePaymentForm;
