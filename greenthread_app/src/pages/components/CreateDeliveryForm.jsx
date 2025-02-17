import React, { useEffect, useState } from "react";
import { Box, Typography, TextField, Button, Paper, Grid } from "@mui/material";
import { useParams } from "react-router-dom";
import http from "../../http";
import { ToastContainer, toast } from "react-toastify";

function CreateDeliveryForm() {
    const { orderID } = useParams();
    const [orderDetails, setOrderDetails] = useState(null);
    const [deliveryAddress, setDeliveryAddress] = useState("");
    const [deliveryStatus, setDeliveryStatus] = useState("Pending");
    const [deliveryExists, setDeliveryExists] = useState(false); // Track existing delivery

    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                const response = await http.get(`/api/Order/${orderID}`);
                setOrderDetails(response.data);
            } catch (err) {
                toast.error("Failed to load order details.");
            }
        };

        const checkExistingDelivery = async () => {
            try {
                const response = await http.get(`/api/Delivery/order/${orderID}`);
                if (response.data.length > 0) {
                    setDeliveryExists(true); // Delivery already exists
                }
            } catch (err) {
                console.warn("No existing delivery found.");
            }
        };

        fetchOrderDetails();
        checkExistingDelivery();
    }, [orderID]);

    const handleCreateDelivery = async () => {
        if (!deliveryAddress) {
            toast.error("Delivery address is required.");
            return;
        }

        const payload = {
            OrderID: parseInt(orderID),
            Address: deliveryAddress,
            DeliveryStatus: deliveryStatus,
        };

        try {
            await http.post("/api/Delivery", payload);
            toast.success("Delivery created successfully.");
            setDeliveryExists(true); // Prevent further creation
        } catch (err) {
            toast.error("Failed to create delivery.");
        }
    };

    if (!orderDetails) {
        return (
            <Box sx={{ mt: 4, textAlign: "center" }}>
                <Typography>Loading order details...</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ mt: 4, maxWidth: "900px", mx: "auto" }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
                Create Delivery for Order #{orderID}
            </Typography>

            <Grid container spacing={2}>
                {/* Order Details Section */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6">Order Details</Typography>
                        <Typography><strong>Order ID:</strong> {orderDetails.orderID}</Typography>
                        <Typography><strong>Total:</strong> ${orderDetails.grandTotal.toFixed(2)}</Typography>
                        <Typography><strong>Status:</strong> {orderDetails.orderStatus}</Typography>
                        <Typography><strong>Date:</strong> {new Date(orderDetails.orderDate).toLocaleDateString()}</Typography>
                    </Paper>
                </Grid>

                {/* Delivery Form Section */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                        <Typography variant="h6">Delivery Form</Typography>
                        <TextField
                            fullWidth
                            label="Delivery Address"
                            variant="outlined"
                            value={deliveryAddress}
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                            sx={{ mb: 2 }}
                        />

                        <TextField
                            fullWidth
                            label="Delivery Status"
                            variant="outlined"
                            value={deliveryStatus}
                            InputProps={{
                                readOnly: true,
                            }}
                            disabled
                            sx={{ mb: 2 }}
                        />

                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleCreateDelivery}
                            disabled={deliveryExists} // Disable if delivery exists
                        >
                            {deliveryExists ? "Delivery Already Created" : "Create Delivery"}
                        </Button>
                    </Paper>
                </Grid>
            </Grid>

            <ToastContainer />
        </Box>
    );
}

export default CreateDeliveryForm;
