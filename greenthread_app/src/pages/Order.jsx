import React, { useContext, useEffect, useState } from "react";
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    CircularProgress,
} from "@mui/material";
import http from "../http";
import UserContext from "../contexts/UserContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Link, useNavigate } from "react-router-dom"; 
import LocalShippingIcon from "@mui/icons-material/LocalShipping";

function Orders() {
    const { user } = useContext(UserContext);
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await http.get(`/api/Order/user-orders/${user.userID}`);
                console.log("API Response (Orders):", response.data);

                if (!response.data || response.data.length === 0) {
                    setOrders([]); // No orders found
                } else {
                    setOrders(response.data);
                    console.log("Orders State Updated:", response.data);
                }
            } catch (err) {
                console.error("Error fetching orders:", err);
                toast.error("Failed to load orders. Please try again later.");
            } finally {
                setLoading(false);
            }
        };

        if (user?.userID) {
            fetchOrders();
        }
    }, [user]);

    const navigateToDeliveryForm = (orderID) => {
        navigate(`/deliveries/${orderID}`);
    };

    const fetchOrderDetails = async (orderID) => {
        setLoadingDetails(true);
        try {
            const response = await http.get(`/api/Order/${orderID}`);
            console.log("Order Details Response:", response.data); // Debug fetched data
            setSelectedOrder(response.data);
        } catch (err) {
            console.error("Error fetching order details:", err);
            toast.error("Failed to load order details. Please try again later.");
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleCloseDialog = () => {
        setSelectedOrder(null);
    };

    if (loading) {
        return (
            <Box sx={{ mt: 4, textAlign: "center" }}>
                <CircularProgress />
                <Typography sx={{ mt: 2 }}>Loading orders...</Typography>
            </Box>
        );
    }

    if (!user) {
        return (
            <Box sx={{ mt: 4, textAlign: "center" }}>
                <Typography variant="h5">My Orders</Typography>
                <Typography color="error">Please log in to access your order history.</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ mt: 4, maxWidth: "900px", mx: "auto", p: 2 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>My Orders</Typography>
            To make a delivery, please press the icon beside the View Order button under the Actions column.

            {orders.length === 0 ? (
                <Typography sx={{ textAlign: "center", mt: 4 }}>
                    There are no orders, consider shopping!
                </Typography>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>Order ID</strong></TableCell>
                                <TableCell><strong>Date</strong></TableCell>
                                <TableCell><strong>Total</strong></TableCell>
                                <TableCell><strong>Status</strong></TableCell>
                                <TableCell><strong>Actions</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {orders.map((order) => (
                                <TableRow key={order.orderID}>
                                    <TableCell>{order.orderID}</TableCell>
                                    <TableCell>{new Date(order.orderDate).toLocaleDateString()}</TableCell>
                                    <TableCell>${order.grandTotal.toFixed(2)}</TableCell>
                                    <TableCell>{order.orderStatus}</TableCell>
                                    <TableCell>
                                        <Button
                                            variant="outlined"
                                            onClick={() => fetchOrderDetails(order.orderID)}
                                        >
                                            View Order
                                        </Button>
                                        <LocalShippingIcon
                                            color="primary"
                                            sx={{ ml: 2, cursor: "pointer" }}
                                            onClick={() => navigateToDeliveryForm(order.orderID)}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {selectedOrder && (
                <Dialog open onClose={handleCloseDialog} fullWidth maxWidth="md">
                    <DialogTitle>Order Details</DialogTitle>
                    <DialogContent>
                        {loadingDetails ? (
                            <CircularProgress />
                        ) : (
                            <>
                                <Typography variant="h6" sx={{ mt: 2 }}>User Details</Typography>
                                <TableContainer component={Paper} sx={{ mt: 2 }}>
                                    <Table>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell><strong>Name</strong></TableCell>
                                                <TableCell>{`${selectedOrder?.user?.firstName || "N/A"} ${selectedOrder?.user?.lastName || "N/A"}`}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell><strong>Email</strong></TableCell>
                                                <TableCell>{selectedOrder?.user?.email || "N/A"}</TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                                <Typography variant="h6" sx={{ mt: 2 }}>Payment Details</Typography>
                                <TableContainer component={Paper} sx={{ mt: 2 }}>
                                    <Table>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell><strong>Payment Method</strong></TableCell>
                                                <TableCell>{selectedOrder?.payment?.paymentMethod || "N/A"}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell><strong>Address</strong></TableCell>
                                                <TableCell>{selectedOrder?.payment?.address || "N/A"}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell><strong>Phone</strong></TableCell>
                                                <TableCell>{selectedOrder?.payment?.phoneNumber || "N/A"}</TableCell>
                                            </TableRow>
                                            <TableRow>
                                                <TableCell><strong>Amount Paid</strong></TableCell>
                                                <TableCell sx={{ color: "red", fontWeight: "bold" }}>
                                                    ${selectedOrder?.payment?.amountPaid?.toFixed(2) || "N/A"}
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                                <Typography variant="h6" sx={{ mt: 2 }}>Order Items</Typography>
                                <TableContainer component={Paper} sx={{ mt: 2 }}>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell><strong>Product</strong></TableCell>
                                                <TableCell><strong>Original Price</strong></TableCell>
                                                <TableCell><strong>Discount %</strong></TableCell>
                                                <TableCell><strong>Discounted Price</strong></TableCell>
                                                <TableCell><strong>Quantity</strong></TableCell>
                                                <TableCell><strong>Total</strong></TableCell>
                                            </TableRow>
                                        </TableHead>
                                            <TableBody>
                                                {selectedOrder?.items?.length > 0 ? (
                                                    selectedOrder.items.map((item, index) => {
                                                        const price = item.price || 0;
                                                        const discountPercentage = item.discountPercentage || 0;
                                                        const discountedPrice = price * (1 - discountPercentage / 100);
                                                        return (
                                                            <TableRow key={index}>
                                                                <TableCell>{item.productName}</TableCell>
                                                                <TableCell>${price.toFixed(2)}</TableCell>
                                                                <TableCell>{discountPercentage.toFixed(2)}%</TableCell>
                                                                <TableCell>${discountedPrice.toFixed(2)}</TableCell>
                                                                <TableCell>{item.quantity}</TableCell>
                                                                <TableCell>${(discountedPrice * item.quantity).toFixed(2)}</TableCell>
                                                            </TableRow>
                                                        );
                                                    })
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={6} align="center">No items in this order.</TableCell>
                                                    </TableRow>
                                                )}
                                                <TableRow>
                                                    <TableCell colSpan={5} align="right"><strong>Grand Total</strong></TableCell>
                                                    <TableCell>
                                                        <strong>
                                                            ${selectedOrder?.items?.reduce((total, item) => {
                                                                const discountedPrice = item.price * (1 - (item.discountPercentage || 0) / 100);
                                                                return total + discountedPrice * item.quantity;
                                                            }, 0).toFixed(2) || "0"}
                                                        </strong>
                                                    </TableCell>
                                                </TableRow>
                                            </TableBody>

                                    </Table>
                                </TableContainer>
                            </>
                        )}
                    </DialogContent>
                </Dialog>
            )}

            <ToastContainer />
        </Box>
    );
}

export default Orders;
