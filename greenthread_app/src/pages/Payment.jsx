import React, { useContext, useEffect, useState } from "react";
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import http from "../http";
import UserContext from "../contexts/UserContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Payment() {
    const { user } = useContext(UserContext);
    const navigate = useNavigate();
    const [payments, setPayments] = useState([]); // Store payments
    const [loading, setLoading] = useState(true); // Control loading state
    const [error, setError] = useState(""); // Store error messages

    useEffect(() => {
        if (user && user.userID) {
            fetchUserPayments(); // Fetch payments if user is logged in
        } else {
            setError("User is not logged in. Please log in to view your payments.");
            setLoading(false);
        }
    }, [user]);

    const fetchUserPayments = async () => {
        try {
            const response = await http.get(`/api/Payment/user-payments/${user.userID}`);
            console.log("Payments fetched:", response.data); // Debugging: Check API response
            setPayments(response.data); // Populate payments with user's data
        } catch (err) {
            console.error("Error fetching payments:", err);
            setError("Failed to load payments. Please try again later.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ mt: 4, mx: "auto", maxWidth: "900px", textAlign: "center" }}>
                <Typography variant="h5">Loading...</Typography>
            </Box>
        );
    }

    if (!user) {
        return (
            <Box sx={{ mt: 4, mx: "auto", maxWidth: "900px", textAlign: "center" }}>
                <Typography variant="h5" sx={{ mb: 2 }}>My Payments</Typography>
                <Typography color="error">Please log in to access your payment history.</Typography>
                <Button variant="contained" color="primary" onClick={() => navigate("/login")}>
                    Go to Login
                </Button>
            </Box>
        );
    }

    return (
        <Box sx={{ mt: 4, mx: "auto", maxWidth: "900px", p: 2 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>My Payments</Typography>

            {payments.length === 0 ? (
                <Typography sx={{ textAlign: "center", mt: 4 }}>
                    You have no payments, consider making a purchase!
                </Typography>
            ) : (
                        <TableContainer component={Paper} sx={{ mt: 2 }}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell><strong>Payment ID</strong></TableCell>
                                        <TableCell><strong>Amount Paid</strong></TableCell>
                                        <TableCell><strong>Payment Method</strong></TableCell>
                                        <TableCell><strong>Address</strong></TableCell>
                                        <TableCell><strong>Phone</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {payments.map((payment) => (
                                        <TableRow key={payment.paymentID}>
                                            <TableCell>{payment.paymentID}</TableCell>
                                            <TableCell>${payment.amountPaid.toFixed(2)}</TableCell>
                                            <TableCell>{payment.paymentMethod}</TableCell>
                                            <TableCell>{payment.address}</TableCell>
                                            <TableCell>{payment.phoneNumber}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                    <Box sx={{ mt: 2, textAlign: "center" }}>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => navigate("/profile")} 
                        >
                            Back to My Profile
                        </Button>
                    </Box>
            <ToastContainer />
        </Box>
    );
}

export default Payment;
