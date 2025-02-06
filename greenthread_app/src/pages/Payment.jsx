import React, { useContext, useEffect, useState } from "react";
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";
import http from "../http";
import UserContext from "../contexts/UserContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Payment() {
    const { user } = useContext(UserContext);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (user) {
            fetchPayments();
        }
    }, [user]);

    const fetchPayments = async () => {
        try {
            const response = await http.get("/api/Payment");
            const userPayments = response.data.filter((p) => p.userID === user.userID);
            setPayments(userPayments);
        } catch {
            setError("Failed to load payments.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Typography>Loading...</Typography>;

    return (
        <Box sx={{ mt: 4, mx: "auto", maxWidth: "900px" }}>
            <Typography variant="h5" sx={{ mb: 2 }}>My Payments</Typography>

            {error ? (
                <Typography color="error">{error}</Typography>
            ) : (
                <>
                    {payments.length === 0 ? (
                        <Typography>You have no payments.</Typography>
                    ) : (
                        <TableContainer component={Paper} sx={{ mt: 2 }}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell><strong>Payment ID</strong></TableCell>
                                        <TableCell><strong>Amount Paid</strong></TableCell>
                                        <TableCell><strong>Method</strong></TableCell>
                                        <TableCell><strong>Address</strong></TableCell>
                                        <TableCell><strong>Phone</strong></TableCell>
                                        <TableCell><strong>Status</strong></TableCell>
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
                                            <TableCell>{payment.paymentStatus}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </>
            )}
            <ToastContainer />
        </Box>
    );
}

export default Payment;
