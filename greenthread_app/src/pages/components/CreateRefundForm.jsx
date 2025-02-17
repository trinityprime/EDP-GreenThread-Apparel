import React, { useState, useEffect } from "react";
import { Box, Button, TextField, Typography, CircularProgress } from "@mui/material";
import http from "../../http";
import { useNavigate, useParams } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";

const CreateRefundForm = () => {
    const { orderID } = useParams(); // ✅ Get orderID from URL
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [reason, setReason] = useState("");
    const [refundExists, setRefundExists] = useState(false); // ✅ Track if refund already exists

    useEffect(() => {
        console.log("Order ID received:", orderID);

        // ✅ Check if refund already exists for this order
        const checkExistingRefund = async () => {
            try {
                const response = await http.get(`/api/Refund/order/${orderID}`);
                if (response.data) {
                    setRefundExists(true);
                }
            } catch (error) {
                if (error.response?.status === 404) {
                    console.warn(`No refund found for order ${orderID}.`); // ✅ Handle missing refund
                } else {
                    console.error("Error checking existing refund:", error);
                    toast.error("Failed to check existing refund.");
                }
            }
        };

        if (orderID) {
            checkExistingRefund();
        }
    }, [orderID]);

    const handleSubmit = async () => {
        if (!orderID) {
            toast.error("Invalid order. Cannot process refund.");
            return;
        }

        // ✅ Require at least 3 characters for reason
        if (reason.trim().length < 3) {
            toast.error("Reason must be at least 3 characters long.");
            return;
        }

        // ✅ Prevent duplicate refund requests
        if (refundExists) {
            toast.error(`You have already made a refund request for Order ${orderID}!`);
            return; // ✅ Prevents navigation
        }

        setLoading(true);
        try {
            await http.post("/api/Refund", {
                OrderID: parseInt(orderID),
                Reason: reason.trim()
            });

            toast.success("Refund successfully sent! Please wait for admin approval.", {
                onClose: () => navigate("/refunds"),
                autoClose: 2000
            });

        } catch (error) {
            console.error("Refund Request Error:", error);
            toast.error(error.response?.data || "Failed to request refund.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ maxWidth: 500, mx: "auto", mt: 4, p: 3, boxShadow: 2, borderRadius: 2, backgroundColor: "white" }}>
            <Typography variant="h5" sx={{ mb: 3 }}>Request Refund</Typography>
            <Typography sx={{ mb: 2 }}>Refund for Order ID: {orderID || "Unknown"}</Typography>

            <TextField
                label="Reason for Refund"
                fullWidth
                multiline
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                sx={{ mb: 3 }}
            />
            <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={handleSubmit}
                disabled={loading || reason.trim().length < 3}
            >
                {loading ? <CircularProgress size={24} /> : "Submit Refund Request"}
            </Button>

            <ToastContainer position="top-right" autoClose={2000} />
        </Box>
    );
};

export default CreateRefundForm;
