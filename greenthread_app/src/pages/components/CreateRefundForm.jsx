import React, { useState, useEffect } from "react";
import { Box, Button, TextField, Typography, CircularProgress } from "@mui/material";
import http from "../../http";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

const CreateRefundForm = () => {
    const { orderID } = useParams(); // ✅ Ensure we get orderID from the URL
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [reason, setReason] = useState("");

    useEffect(() => {
        console.log("Order ID received:", orderID); // ✅ Debugging: Check if orderID is being retrieved correctly
    }, [orderID]);

    const handleSubmit = async () => {
        if (!reason.trim()) {
            toast.error("Please provide a valid refund reason.");
            return;
        }

        if (!orderID) {
            toast.error("Invalid order. Cannot process refund.");
            return;
        }

        setLoading(true);
        try {
            await http.post("/api/Refund", { OrderID: parseInt(orderID), Reason: reason });

            // ✅ Show success message
            toast.success("Refund successfully sent! Please wait for admin approval.");

            setTimeout(() => {
                navigate("/refunds");
            }, 1500);

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
                disabled={loading}
            >
                {loading ? <CircularProgress size={24} /> : "Submit Refund Request"}
            </Button>
        </Box>
    );
};

export default CreateRefundForm;
