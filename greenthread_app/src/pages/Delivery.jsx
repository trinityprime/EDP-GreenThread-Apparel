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
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
} from "@mui/material";
import http from "../http";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import UserContext from "../contexts/UserContext"; // Import UserContext

function Delivery() {
    const { user } = useContext(UserContext); // Get logged-in user
    const [deliveries, setDeliveries] = useState([]);
    const [selectedDelivery, setSelectedDelivery] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (user) {
            fetchDeliveries(user.userID); // Fetch deliveries for the logged-in user
        }
    }, [user]);

    const fetchDeliveries = async () => {
        if (!user || !user.userID) {
            toast.error("User is not logged in!");
            return;
        }

        try {
            console.log(`Fetching orders for userID: ${user.userID}`);

            //  Fetch orders belonging to the logged-in user
            const orderResponse = await http.get(`/api/Order/user-orders/${user.userID}`);

            const orders = orderResponse.data;

            if (!orders.length) {
                toast.warn("You have no orders yet.");
                setDeliveries([]);
                return;
            }

            //  Fetch deliveries for each order ID
            const allDeliveries = [];
            for (const order of orders) {
                try {
                    const deliveryResponse = await http.get(`/api/Delivery/order/${order.orderID}`);
                    allDeliveries.push(...deliveryResponse.data);
                } catch (err) {
                    console.warn(`No deliveries found for Order ID ${order.orderID}.`);
                }
            }

            setDeliveries(allDeliveries);
        } catch (err) {
            console.error("Error fetching deliveries:", err);
            toast.error("Failed to fetch deliveries.");
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
            fetchDeliveries(user.userID); // Refresh deliveries after update
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
                        {deliveries.length > 0 ? (
                            deliveries.map((delivery) => (
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
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} align="center">
                                    No deliveries available.
                                </TableCell>
                            </TableRow>
                        )}
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
