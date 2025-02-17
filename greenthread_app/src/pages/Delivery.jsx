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
    Select,
    MenuItem,
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
    const [newDelivery, setNewDelivery] = useState({
        orderID: "",
        address: "",
        deliveryStatus: "Pending",
    });

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

    const handleCreateDelivery = async () => {
        try {
            await http.post("/api/Delivery", newDelivery, {
                headers: { "Content-Type": "application/json" },
            });
            toast.success("Delivery created successfully.");
            fetchDeliveries();
            setNewDelivery({ orderID: "", address: "", deliveryStatus: "Pending" });
        } catch (err) {
            toast.error("Failed to create delivery.");
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

    const handleUpdateDeliveryStatus = async (id, newStatus) => {
        try {
            await http.put(`/api/Delivery/${id}/status`, JSON.stringify(newStatus), {
                headers: { "Content-Type": "application/json" },
            });
            toast.success("Delivery status updated successfully.");
            fetchDeliveries();
        } catch (err) {
            toast.error("Failed to update delivery status.");
        }
    };

    const handleDeleteDelivery = async (id) => {
        try {
            await http.delete(`/api/Delivery/${id}`);
            toast.success("Delivery deleted successfully.");
            fetchDeliveries();
        } catch (err) {
            toast.error("Failed to delete delivery.");
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
                Deliveries
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
                                        View
                                    </Button>
                                    <Button
                                        variant="contained"
                                        color="error"
                                        onClick={() => handleDeleteDelivery(delivery.deliveryID)}
                                        sx={{ ml: 2 }}
                                    >
                                        Delete
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Dialog for Viewing/Editing Delivery */}
            {selectedDelivery && (
                <Dialog open={!!selectedDelivery} onClose={handleCloseDialog} fullWidth>
                    <DialogTitle>Delivery Details</DialogTitle>
                    <DialogContent>
                        <Typography><strong>Order ID:</strong> {selectedDelivery.orderID}</Typography>
                        <Typography><strong>Address:</strong> {selectedDelivery.address}</Typography>
                        <Typography><strong>Status:</strong> {selectedDelivery.deliveryStatus}</Typography>

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
                                sx={{ mr: 2 }}
                            />
                            <Select
                                value={selectedDelivery.deliveryStatus}
                                onChange={(e) =>
                                    handleUpdateDeliveryStatus(
                                        selectedDelivery.deliveryID,
                                        e.target.value
                                    )
                                }
                                sx={{ width: "200px" }}
                            >
                                <MenuItem value="Pending">Pending</MenuItem>
                                <MenuItem value="In_Transit">In Transit</MenuItem>
                                <MenuItem value="Delivered">Delivered</MenuItem>
                                <MenuItem value="Cancelled">Cancelled</MenuItem>
                            </Select>
                        </Box>
                    </DialogContent>
                </Dialog>
            )}

            <ToastContainer />
        </Box>
    );
}

export default Delivery;
