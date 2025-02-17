import React, { useEffect, useState } from "react";
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
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
} from "@mui/material";
import http from "../http";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Delivery() {
    const [deliveries, setDeliveries] = useState([]);
    const [selectedDelivery, setSelectedDelivery] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchDeliveries();
    }, []);

    const fetchDeliveries = async () => {
        try {
            const response = await http.get("/api/Delivery");
            setDeliveries(response.data);
        } catch (err) {
            toast.error("Failed to fetch deliveries.");
            setError("Failed to fetch deliveries.");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateDeliveryAddress = async (id, newAddress) => {
        try {
            await http.put(`/api/Delivery/${id}/address`, newAddress, {
                headers: { "Content-Type": "application/json" },
            });
            toast.success("Address updated successfully.");
            fetchDeliveries();
        } catch (err) {
            toast.error("Failed to update address.");
        }
    };

    const handleCloseDialog = () => {
        setSelectedDelivery(null);
    };

    if (loading) return <Typography>Loading...</Typography>;
    if (error) return <Typography color="error">{error}</Typography>;

    return (
        <Box sx={{ mt: 4, mx: "auto", maxWidth: "900px" }}>
            <Typography variant="h4" sx={{ mb: 4 }}>
                Your Deliveries
            </Typography>

            {/* Delivery Table */}
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell><strong>Delivery ID</strong></TableCell>
                            <TableCell><strong>Order ID</strong></TableCell>
                            <TableCell><strong>Address</strong></TableCell>
                            <TableCell><strong>Status</strong></TableCell>
                            <TableCell><strong>Actions</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {deliveries.map((delivery) => (
                            <TableRow key={delivery.deliveryID}>
                                <TableCell>{delivery.deliveryID}</TableCell>
                                <TableCell>{delivery.orderID}</TableCell>
                                <TableCell>{delivery.address}</TableCell>
                                <TableCell>{delivery.deliveryStatus}</TableCell>
                                <TableCell>
                                    <Button
                                        variant="outlined"
                                        onClick={() => setSelectedDelivery(delivery)}
                                    >
                                        View / Edit Address
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Dialog for Viewing/Editing Address */}
            {selectedDelivery && (
                <Dialog open={!!selectedDelivery} onClose={handleCloseDialog} fullWidth>
                    <DialogTitle>Delivery Details</DialogTitle>
                    <DialogContent>
                        <Typography><strong>Order ID:</strong> {selectedDelivery.orderID}</Typography>
                        <Typography><strong>Address:</strong> {selectedDelivery.address}</Typography>
                        <Typography><strong>Status:</strong> {selectedDelivery.deliveryStatus}</Typography>

                        {/* User can only update the Address */}
                        <Box sx={{ mt: 2 }}>
                            <TextField
                                label="Update Address"
                                defaultValue={selectedDelivery.address}
                                onBlur={(e) =>
                                    handleUpdateDeliveryAddress(
                                        selectedDelivery.deliveryID,
                                        e.target.value
                                    )
                                }
                                fullWidth
                            />
                        </Box>
                    </DialogContent>
                </Dialog>
            )}

            <ToastContainer />
        </Box>
    );
}

export default Delivery;
