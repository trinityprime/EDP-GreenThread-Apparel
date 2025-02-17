import React, { useState, useEffect, useContext } from "react";
import { Box, Button, TextField, Typography, CircularProgress } from "@mui/material";
import http from "../../http";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import UserContext from "../../contexts/UserContext";

const CreateRefundForm = () => {
    const { user } = useContext(UserContext); // Get the logged-in user
    const { orderID } = useParams(); // Get orderID from URL params
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [reason, setReason] = useState("");

    useEffect(() => {
        console.log("Order ID from URL:", orderID);
    }, [orderID]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        if (!user) {
            toast.error("You must be logged in to request a refund.");
            setLoading(false);
            return;
        }

        if (!orderID) {
            toast.error("Invalid Order ID. Please try again.");
            setLoading(false);
            return;
        }

        try {
            const requestData = {
                OrderID: parseInt(orderID, 10), // Ensure it's an integer
                UserID: user.userID, // Pass the logged-in user ID
                Reason: reason, // Include refund reason if required
            };

            console.log("Request Data:", requestData);

            const response = await http.post("/api/Refund", requestData);

            toast.success("Refund request submitted successfully!");
            navigate("/orders"); // Redirect to Orders page
        } catch (error) {
            console.error("Refund Request Error:", error);
            toast.error(error.response?.data || "Failed to request refund.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ maxWidth: 500, mx: "auto", mt: 4, p: 3, boxShadow: 3, borderRadius: 2, backgroundColor: "white" }}>
            <Typography variant="h5" sx={{ mb: 3 }}>Request Refund</Typography>
            <Typography sx={{ mb: 2 }}>Refund for Order ID: {orderID}</Typography>
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
