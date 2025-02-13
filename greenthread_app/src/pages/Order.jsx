import React, { useContext, useEffect, useState } from "react";
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";
import http from "../http";
import UserContext from "../contexts/UserContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Orders() {
    const { user } = useContext(UserContext);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (user && user.userID) {
            fetchOrders();
        }
    }, [user]);

    const fetchOrders = async () => {
        try {
            if (!user || !user.userID) {
                throw new Error("User is not authenticated or userID is missing.");
            }
            const response = await http.get(`/api/Order/user-orders/${user.userID}`);
            console.log("Orders Response:", response.data); // Debug API response
            setOrders(response.data || []); // Ensure orders is always an array
        } catch (error) {
            console.error("Error fetching orders:", error);
            setError("Failed to load orders.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <Typography>Loading...</Typography>;

    return (
        <Box sx={{ mt: 4, mx: "auto", maxWidth: "900px" }}>
            <Typography variant="h5" sx={{ mb: 2 }}>My Orders</Typography>

            {error ? (
                <Typography color="error">{error}</Typography>
            ) : (
                <>
                    {orders.length === 0 ? (
                        <Typography>You have no orders.</Typography>
                    ) : (
                        <TableContainer component={Paper} sx={{ mt: 2 }}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell><strong>Order ID</strong></TableCell>
                                        <TableCell><strong>Date</strong></TableCell>
                                        <TableCell><strong>Total</strong></TableCell>
                                        <TableCell><strong>Status</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {orders.map((order) => (
                                        <TableRow key={order.orderID}>
                                            <TableCell>{order.orderID}</TableCell>
                                            <TableCell>{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                                            <TableCell>${order.grandTotal.toFixed(2)}</TableCell>
                                            <TableCell>{order.orderStatus}</TableCell>
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

export default Orders;
