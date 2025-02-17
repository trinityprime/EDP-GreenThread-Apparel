import React, { useEffect, useState, useContext } from "react";
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
    CircularProgress,
    Dialog,
    DialogTitle,
    DialogContent
} from "@mui/material";
import http from "../http";
import UserContext from "../contexts/UserContext";
import { ToastContainer, toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

function Refund() {
    const { user } = useContext(UserContext);
    const [refunds, setRefunds] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // State for selected refund details
    const [selectedRefund, setSelectedRefund] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);

    useEffect(() => {
        if (!user) {
            toast.error("Please log in to view refunds.");
            navigate("/login");
        } else {
            fetchRefunds();
        }
    }, [user, navigate]);

    const fetchRefunds = async () => {
        try {
            const response = await http.get(`/api/Refund/user-refunds/${user.userID}`);
            const sortedRefunds = response.data.sort((a, b) => a.refundID - b.refundID);
            setRefunds(sortedRefunds);
        } catch (error) {
            toast.error("Failed to load refunds.");
        } finally {
            setLoading(false);
        }
    };

    // Fetch order details when user clicks "View Details"
    const fetchRefundDetails = async (refundID, orderID) => {
        setLoadingDetails(true);
        try {
            const orderResponse = await http.get(`/api/Order/${orderID}`);
            const refundResponse = refunds.find(r => r.refundID === refundID);

            console.log("Fetched Order Details:", orderResponse.data);
            console.log("Fetched Refund Details:", refundResponse); // Debugging refund details

            setSelectedRefund({
                ...orderResponse.data,
                refundID,
                refundReason: refundResponse?.reason || "No reason provided",
            });
        } catch (error) {
            toast.error("Failed to load refund details.");
        } finally {
            setLoadingDetails(false);
        }
    };


    const handleCloseDialog = () => {
        setSelectedRefund(null);
    };

    return (
        <Box sx={{ mt: 4, maxWidth: "900px", mx: "auto", p: 2 }}>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: "bold" }}>My Refund Requests</Typography>

            {loading ? (
                <CircularProgress />
            ) : refunds.length === 0 ? (
                <Typography sx={{ textAlign: "center", mt: 4 }}>No refunds found.</Typography>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>Refund ID</strong></TableCell>
                                <TableCell><strong>Order ID</strong></TableCell>
                                <TableCell><strong>Amount</strong></TableCell>
                                <TableCell><strong>Status</strong></TableCell>
                                <TableCell><strong>Requested Date</strong></TableCell>
                                <TableCell><strong>Actions</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {refunds.map((refund) => (
                                <TableRow key={refund.refundID}>
                                    <TableCell>{refund.refundID}</TableCell>
                                    <TableCell>{refund.orderID}</TableCell>
                                    <TableCell>${refund.refundAmount.toFixed(2)}</TableCell>
                                    <TableCell>{refund.refundStatus}</TableCell>
                                    <TableCell>{new Date(refund.refundDate).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            onClick={() => fetchRefundDetails(refund.refundID, refund.orderID)}
                                        >
                                            View Details
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* View Refund Details Dialog */}
            {selectedRefund && (
                <Dialog open onClose={handleCloseDialog} fullWidth maxWidth="md">
                    <DialogTitle>Refund Details</DialogTitle>
                    <DialogContent>
                        {loadingDetails ? (
                            <CircularProgress />
                        ) : (
                            <>
                                {/* Payment Details */}
                                <Typography variant="h6" sx={{ mt: 2 }}>Payment Information</Typography>
                                <TableContainer component={Paper} sx={{ mt: 2 }}>
                                    <Table>
                                        <TableBody>
                                            <TableRow>
                                                <TableCell><strong>Amount Paid</strong></TableCell>
                                                    <TableCell sx={{ color: "red", fontWeight: "bold" }}>
                                                        ${selectedRefund?.payment?.amountPaid?.toFixed(2) || "N/A"}
                                                </TableCell>
                                            </TableRow>
                                        </TableBody>
                                    </Table>
                                </TableContainer>

                                {/* Order Items */}
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
                                            {selectedRefund.items.length > 0 ? (
                                                selectedRefund.items.map((item, index) => {
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
                                                        ${selectedRefund?.items?.reduce((total, item) => {
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

export default Refund;
