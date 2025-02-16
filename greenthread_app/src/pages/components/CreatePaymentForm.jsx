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
    const [errors, setErrors] = useState({});
    const [shoppingCart, setShoppingCart] = useState(null);
    const [cartTotal, setCartTotal] = useState(0);

    useEffect(() => {
        const fetchShoppingCart = async () => {
            try {
                const response = await http.get(`/api/ShoppingCart/${user?.userID}`);
                setShoppingCart(response.data);
                setCartTotal(
                    response.data.reduce((acc, item) => acc + item.grandTotal, 0)
                );
            } catch (err) {
                console.error("Error fetching shopping cart:", err);
                toast.error("Failed to fetch shopping cart. Please try again.");
                navigate("/shopping-cart");
            }
        };

        if (user) {
            fetchShoppingCart();
        }
    }, [user, navigate]);


    const handleChange = (e) => {
        setPaymentDetails({ ...paymentDetails, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: "" });
    };

    const validateFields = () => {
        const { address, phoneNumber } = paymentDetails;
        const newErrors = {};

        if (!phoneNumber || !/^\d{8,15}$/.test(phoneNumber)) {
            newErrors.phoneNumber = "Phone number must be between 8 to 15 digits.";
        }

        if (!address || address.trim().length < 3) {
            newErrors.address = "Address must be more than 3 characters.";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // In CreatePaymentForm.js
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateFields()) return;

        try {
            const paymentData = {
                userID: user?.userID, // Make sure this matches exactly (case sensitive)
                address: paymentDetails.address,
                phoneNumber: paymentDetails.phoneNumber,
                paymentMethod: paymentDetails.paymentMethod,
            };

            console.log('Sending payment data:', paymentData); // Debug log

            const response = await http.post("/api/Payment/checkout", paymentData);
            console.log('Payment and order response:', response.data); // Debug log

            if (response.data.message === "Payment and order created successfully.") {
                toast.success("Payment and order created successfully! Redirecting to orders...");

                // Clear cart data
                localStorage.removeItem("cartSummary");

                // Add slight delay before redirect
                setTimeout(() => {
                    navigate("/orders");
                }, 1500);
            } else {
                toast.error("Failed to create order. Please try again.");
            }
        } catch (error) {
            console.error("Payment Error:", error.response?.data);
            toast.error(error.response?.data?.message || "Payment failed. Please try again later.");
        }
    };

    if (!user || !shoppingCart) {
        return (
            <Box sx={{ mt: 4, mx: "auto", maxWidth: "600px", textAlign: "center" }}>
                <Typography variant="h5">Loading...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: "600px", mx: "auto", mt: 4, p: 2 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>Enter Payment Details</Typography>
            <form onSubmit={handleSubmit}>
                <TextField
                    fullWidth
                    label="Address"
                    name="address"
                    value={paymentDetails.address}
                    onChange={handleChange}
                    sx={{ mb: 2 }}
                    required
                    error={!!errors.address}
                    helperText={errors.address}
                />
                <TextField
                    fullWidth
                    label="Phone Number"
                    name="phoneNumber"
                    value={paymentDetails.phoneNumber}
                    onChange={handleChange}
                    sx={{ mb: 2 }}
                    required
                    error={!!errors.phoneNumber}
                    helperText={errors.phoneNumber}
                />
                <FormControl fullWidth sx={{ mb: 2 }}>
                    <InputLabel>Payment Method</InputLabel>
                    <Select
                        name="paymentMethod"
                        value={paymentDetails.paymentMethod}
                        onChange={handleChange}
                    >
                        <MenuItem value="Credit Card">Credit Card</MenuItem>
                        <MenuItem value="PayPal">PayPal</MenuItem>
                        <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                    </Select>
                </FormControl>

                <Typography variant="h6" sx={{ mb: 2 }}>Grand Total: ${cartTotal.toFixed(2)}</Typography>

                <Button fullWidth type="submit" variant="contained" color="primary" sx={{ mb: 2 }}>
                    Proceed to Payment
                </Button>

                <Button
                    fullWidth
                    variant="outlined"
                    color="secondary"
                    onClick={() => navigate("/shopping-cart")}
                >
                    Back to Shopping Cart
                </Button>
            </form>
            <ToastContainer />
        </Box>
    );
}

export default CreatePaymentForm;
