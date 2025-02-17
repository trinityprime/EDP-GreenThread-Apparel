import React, { useState, useEffect, useContext, useRef } from "react";
import { Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Select, MenuItem, Dialog, DialogTitle, DialogContent, TextField, CircularProgress } from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import UserContext from "../contexts/UserContext";
import { useNavigate } from "react-router-dom";
import http from "../http";

function AdminDashboard() {
    const { user } = useContext(UserContext);
    const [admins, setAdmins] = useState([]);
    const [users, setUsers] = useState([]);
    const [payments, setPayments] = useState([]);
    const [orders, setOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [deliveries, setDeliveries] = useState([]);
    const [selectedDelivery, setSelectedDelivery] = useState(null);
    const [refunds, setRefunds] = useState([]);
    const [selectedRefunds, setSelectedRefunds] = useState(null);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updatedAddress, setUpdatedAddress] = useState("");
    const [updatedStatus, setUpdatedStatus] = useState("");

    const adminSectionRef = useRef(null);
    const userSectionRef = useRef(null);
    const productsSectionRef = useRef(null);
    const paymentsSectionRef = useRef(null);
    const ordersSectionRef = useRef(null);
    const deliveriesSectionRef = useRef(null);
    const refundsSectionRef = useRef(null);

    const sectionRefs = [
        { name: "Admins", ref: adminSectionRef },
        { name: "Users", ref: userSectionRef },
        { name: "Products", ref: productsSectionRef },
        { name: "Payments", ref: paymentsSectionRef },
        { name: "Orders", ref: ordersSectionRef },
        { name: "Deliveries", ref: deliveriesSectionRef },
        { name: "Refunds", ref: refundsSectionRef },
    ];

    const handleScrollToSection = (ref) => {
        ref.current.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (user && user.role === 'Admin') {
            // Fetch admin data
            http.get("/admin/all")
                .then((res) => {
                    setAdmins(res.data);
                })
                .catch((err) => {
                    toast.error("Failed to fetch admin data.");
                    console.error("Error fetching admins:", err);
                });

            // Fetch user data
            http.get("/user/all")
                .then((res) => {
                    setUsers(res.data);
                })
                .catch((err) => {
                    toast.error("Failed to fetch user data.");
                    console.error("Error fetching users:", err);
                })
                .finally(() => {
                    setLoading(false); // Stop loading after fetching data
                });

            // Fetch payment data
            http.get("/api/Payment")
                .then((res) => setPayments(res.data))
                .catch(() => toast.error("Failed to fetch payment data."))
                .finally(() => setLoading(false));

            // Fetch order data
            http.get("/api/Order")
                .then((res) => setOrders(res.data))
                .catch(() => toast.error("Failed to fetch order data."))
                .finally(() => setLoading(false));

            // Fetch product data
            http.get("/api/Product")
                .then((res) => setProducts(res.data))
                .catch(() => toast.error("Failed to fetch product data."))
                .finally(() => setLoading(false));

            // Fetch deliveries data
            http.get("/api/Delivery")
                .then((res) => { setDeliveries(res.data) })
                .catch(() => toast.error("Failed to fetch delivery data."))
                .finally(() => setLoading(false));

            // Fetch refunds data
            http.get("/api/Refund")
                .then((res) => setRefunds(res.data))
                .catch(() => toast.error("Failed to fetch refund data."));
        } else {
            // Redirect non-admin users
            toast.error("You do not have admin permissions.");
            navigate('/not-authorized');
        }
    }, [user, navigate]);

    if (loading) {
        return <Typography>Loading...</Typography>; // Show a loading message
    }

    if (!user || user.role !== 'Admin') {
        return null; // Do not render the dashboard for non-admin users
    }

    const handleToggleActivation = (id, type, isDeactivated) => {
        const endpoint = isDeactivated ? `activate` : `deactivate`;

        http.put(`/${type}/${endpoint}/${id}`)
            .then(() => {
                toast.success(
                    `${type.charAt(0).toUpperCase() + type.slice(1)} ${isDeactivated ? 'activated' : 'deactivated'} successfully.`
                );

                // Update the local state
                const updatedEntity = type === 'admin' ? admins : users;
                const updatedData = updatedEntity.map((item) =>
                    item[`${type}ID`] === id ? { ...item, isDeactivated: !isDeactivated } : item
                );

                if (type === 'admin') {
                    setAdmins(updatedData);
                } else {
                    setUsers(updatedData);
                }
            })
            .catch((err) => {
                toast.error(`Failed to ${isDeactivated ? 'activate' : 'deactivate'}.`);
                console.error(`Error ${isDeactivated ? 'activating' : 'deactivating'}:`, err);
            });
    };

    const handleUpdate = (id, type) => {
        navigate(`/update-${type}/${id}`);
    };

    const handleViewOrder = async (orderID) => {
        setLoadingDetails(true); // Start loading
        try {
            const response = await http.get(`/api/Order/${orderID}`);
            setSelectedOrder(response.data); // Set the selected order details
        } catch (err) {
            toast.error("Failed to load order details.");
            console.error(err);
        } finally {
            setLoadingDetails(false); // Stop loading
        }
    };

    const handleCloseDialog = () => {
        setSelectedOrder(null); // Close the dialog
    };

    const fetchUserPayments = async () => {
        try {
            const response = await http.get(`/api/Payment/user-payments/${user.userID}`);
            setPayments(response.data); // Populate payments with the user's data
        } catch (err) {
            console.error("Error fetching payments:", err);
            setError("Failed to load payments.");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePaymentStatus = async (paymentId, newStatus) => {
        try {
            const payload = { paymentStatus: newStatus }; // Only send paymentStatus
            await http.put(`/api/Payment/${paymentId}`, payload, {
                headers: { "Content-Type": "application/json" },
            });
            toast.success(`Payment ${paymentId} updated to ${newStatus}`);
            setPayments((prevPayments) =>
                prevPayments.map((payment) =>
                    payment.paymentID === paymentId
                        ? { ...payment, paymentStatus: newStatus }
                        : payment
                )
            );
        } catch (error) {
            console.error("Error updating payment status:", error);
            toast.error(
                error.response?.data?.message || "Failed to update payment status."
            );
        }
    };

    const handleDeletePayment = async (paymentId) => {
        try {
            await http.delete(`/api/Payment/${paymentId}`);
            toast.success(`Payment ${paymentId} deleted successfully.`);
            setPayments((prevPayments) =>
                prevPayments.filter((payment) => payment.paymentID !== paymentId)
            );
        } catch (error) {
            console.error("Error deleting payment:", error);
            if (error.response?.data) {
                toast.error(error.response.data); // Show backend error message
            } else {
                toast.error("An unexpected error occurred while deleting the payment.");
            }
        }
    };


    const handleUpdateOrderStatus = async (id, newStatus) => {
        try {
            await http.put(`/api/Order/${id}`, JSON.stringify(newStatus), {
                headers: { "Content-Type": "application/json" }
            });
            toast.success(`Order ${id} updated to ${newStatus}`);
            setOrders((prevOrders) =>
                prevOrders.map((order) => (order.orderID === id ? { ...order, orderStatus: newStatus } : order))
            );
        } catch {
            toast.error("Failed to update order status.");
        }
    };

    const handleDeleteOrder = async (id, status) => {
        if (status !== "Cancelled") {
            toast.error("Only cancelled orders can be deleted.");
            return;
        }
        try {
            await http.delete(`/api/Order/${id}`);
            toast.success(`Order ${id} deleted successfully.`);
            setOrders((prevOrders) => prevOrders.filter((order) => order.orderID !== id));
        } catch {
            toast.error("Failed to delete order.");
        }
    };

    const handleDeleteProduct = async (id) => {
        try {
            await http.delete(`/api/Product/${id}`);
            toast.success("Product deleted successfully.");
            setProducts((prev) => prev.filter((product) => product.productID !== id));
        } catch (err) {
            toast.error("Failed to delete product.");
        }
    };

    const handleViewDelivery = (delivery) => {
        setSelectedDelivery(delivery);
        setUpdatedAddress(delivery.address);
        setUpdatedStatus(delivery.deliveryStatus);
    };


    const fetchDeliveries = async () => {
        try {
            const response = await http.get("/api/Delivery");
            setDeliveries(response.data);
        } catch (err) {
            toast.error("Failed to fetch deliveries.");
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateDeliveryAddress = async (id, newAddress) => {
        try {
            console.log("Updating delivery address:", { id, newAddress }); // Debugging log

            await http.put(`/api/Delivery/${id}/address`,
                { newAddress }, // Send as JSON object
                { headers: { "Content-Type": "application/json" } }
            );

            toast.success("Address updated successfully.");
            fetchDeliveries();
        } catch (err) {
            console.error("Failed to update address:", err.response?.data);
            toast.error(`Failed to update address: ${err.response?.data || "Unknown error"}`);
        }
    };

    const handleUpdateDeliveryStatus = async (id, newStatus) => {
        try {
            console.log("Updating delivery status:", { id, newStatus }); // Debugging log

            await http.put(`/api/Delivery/${id}/status`,
                { NewStatus: newStatus }, // Send as JSON object
                { headers: { "Content-Type": "application/json" } }
            );

            toast.success(`Delivery ${id} updated to ${newStatus}`);
            setDeliveries((prevDeliveries) =>
                prevDeliveries.map((delivery) =>
                    delivery.deliveryID === id
                        ? { ...delivery, deliveryStatus: newStatus }
                        : delivery
                )
            );
        } catch (err) {
            console.error("Error updating delivery status:", err.response?.data);
            toast.error(`Failed to update delivery status: ${err.response?.data || "Unknown error"}`);
        }
    };

    const handleDeleteDelivery = async (id) => {
        try {
            console.log("Deleting delivery:", id); // Debugging log

            const response = await http.delete(`/api/Delivery/${id}`);
            console.log("Delete response:", response); // Log response

            toast.success("Delivery deleted successfully.");
            fetchDeliveries();
        } catch (err) {
            console.error("Failed to delete delivery:", err.response?.data);
            toast.error(`Failed to delete delivery: ${err.response?.data || "Unknown error"}`);
        }
    };

    const fetchRefundDetails = async (refundID) => {
        setLoadingDetails(true);
        try {
            const response = await http.get(`/api/Refund/${refundID}`);
            setSelectedRefunds(response.data);
        } catch (err) {
            toast.error("Failed to load refund details.");
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleUpdateRefundStatus = async (refundID, newStatus) => {
        try {
            await http.put(`/api/Refund/${refundID}/status`, JSON.stringify(newStatus), {
                headers: { "Content-Type": "application/json" },
            });

            toast.success(`Refund ${refundID} updated to ${newStatus}`);
            setRefunds((prevRefunds) =>
                prevRefunds.map((refund) =>
                    refund.refundID === refundID ? { ...refund, refundStatus: newStatus } : refund
                )
            );
        } catch (error) {
            toast.error("Failed to update refund status.");
        }
    };

    const handleDeleteRefund = async (refundID, refundStatus) => {
        if (refundStatus !== "Rejected") {
            toast.error("Only rejected refunds can be deleted.");
            return;
        }

        try {
            await http.delete(`/api/Refund/${refundID}`);
            toast.success(`Refund ${refundID} deleted successfully.`);
            setRefunds((prevRefunds) => prevRefunds.filter((refund) => refund.refundID !== refundID));
        } catch (error) {
            toast.error("Failed to delete refund.");
        }
    };


    // Check if the admin is the super admin
    const isSuperAdmin = (admin) => {
        return admin.adminID === 1 && admin.email === 'superadmin@greenthread.com';
    };

    return (
        <Box sx={{ display: "flex", height: "50vh", paddingTop: "30px" }}>
            {/* Left Navigation Box */}
            <Box
                sx={{
                    width: 200, // Thinner navigation
                    backgroundColor: "#fff",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)", // Subtle shadow
                    border: "1px solid #e0e0e0", // Lighter border
                    borderRadius: 2,
                    p: 2,
                    mt: 2,
                    mb: 2,
                }}
            >
                <Typography
                    variant="h6"
                    sx={{
                        textAlign: "center",
                        fontWeight: "bold",
                        borderBottom: "1px solid #e0e0e0",
                        pb: 1,
                        mb: 2,
                    }}
                >
                    Navigation
                </Typography>
                {sectionRefs.map((section, index) => (
                    <Button
                        key={index}
                        fullWidth
                        sx={{
                            justifyContent: "flex-start",
                            textTransform: "none",
                            mb: 1,
                            fontWeight: "medium",
                            color: "#333",
                            py: 1,
                            borderRadius: 1,
                            "&:hover": {
                                backgroundColor: "#f5f5f5",
                            },
                        }}
                        onClick={() => handleScrollToSection(section.ref)}
                    >
                        {section.name}
                    </Button>
                ))}
            </Box>

            <Box sx={{ mt: 4, mx: 'auto', maxWidth: '800px' }} ref={adminSectionRef}>
                {/* Admin List */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mb: 3,
                        px: 2,
                    }}
                    ref={adminSectionRef}
                >
                    <Typography variant="h5" fontWeight="bold" color="text.primary">
                        Admins
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => navigate('/create-admin')}
                    >
                        Create Admin
                    </Button>
                </Box>
                <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
                    <Table>
                        <TableHead sx={{ backgroundColor: 'primary.light' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Admin ID</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Email</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {admins.map((admin) => (
                                <TableRow key={admin.adminID} hover>
                                    <TableCell>{admin.adminID}</TableCell>
                                    <TableCell>{admin.email}</TableCell>
                                    <TableCell>
                                        <Typography
                                            variant="body2"
                                            fontWeight="medium"
                                            color={admin.isDeactivated ? 'error.main' : 'success.main'}
                                        >
                                            {admin.isDeactivated ? "Deactivated" : "Active"}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        {!isSuperAdmin(admin) ? (
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    sx={{
                                                        backgroundColor: admin.isDeactivated ? 'warning.main' : 'error.main',
                                                        '&:hover': {
                                                            backgroundColor: admin.isDeactivated ? 'warning.dark' : 'error.dark',
                                                        },
                                                    }}
                                                    onClick={() => handleToggleActivation(admin.adminID, 'admin', admin.isDeactivated)}
                                                >
                                                    {admin.isDeactivated ? "Activate" : "Deactivate"}
                                                </Button>
                                                <Button
                                                    variant="contained"
                                                    size="small"
                                                    color="primary"
                                                    onClick={() => handleUpdate(admin.adminID, 'admin')}
                                                >
                                                    Update
                                                </Button>
                                            </Box>
                                        ) : (
                                            <Typography variant="body2" color="textSecondary">
                                                Super Admin cannot be updated or deactivated.
                                            </Typography>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Manage Users */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mt: 4,
                        mb: 2,
                        px: 2,
                    }}
                    ref={userSectionRef}  // Ensure you have this ref defined, or remove if not needed
                >
                    <Typography variant="h5" fontWeight="bold" color="text.primary">
                        Users
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => navigate('/create-user')}
                    >
                        Create User
                    </Button>
                </Box>
                <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
                    <Table>
                        <TableHead sx={{ backgroundColor: 'primary.light' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>User ID</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Name</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Email</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Postal Code</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.userID} hover>
                                    <TableCell>{user.userID}</TableCell>
                                    <TableCell>
                                        {user.firstName} {user.lastName}
                                    </TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{user.postalCode}</TableCell>
                                    <TableCell>
                                        <Typography
                                            variant="body2"
                                            fontWeight="medium"
                                            color={user.isDeactivated ? 'error.main' : 'success.main'}
                                        >
                                            {user.isDeactivated ? 'Deactivated' : 'Active'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Button
                                                variant="contained"
                                                size="small"
                                                color="primary"
                                                onClick={() => navigate(`/update-user/${user.userID}`)}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                variant="contained"
                                                size="small"
                                                color="error"
                                                onClick={() => handleToggleActivation(user.userID, 'user', user.isDeactivated)}
                                            >
                                                Deactivate
                                            </Button>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                {users.length === 0 && (
                    <Typography sx={{ mt: 2 }} color="textSecondary">
                        No users available.
                    </Typography>
                )}


                {/* Manage Products */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mt: 4,
                        mb: 2,
                        px: 2,
                    }}
                    ref={productsSectionRef}
                >
                    <Typography variant="h5" fontWeight="bold" color="text.primary">
                        Products
                    </Typography>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => navigate("/create-product")}
                    >
                        Create Product
                    </Button>
                </Box>
                <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
                    <Table>
                        <TableHead sx={{ backgroundColor: 'primary.light' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Product ID</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Name</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Price</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Stock</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {products.map((product) => (
                                <TableRow key={product.productID} hover>
                                    <TableCell>{product.productID}</TableCell>
                                    <TableCell>{product.productName}</TableCell>
                                    <TableCell>${product.finalPrice.toFixed(2)}</TableCell>
                                    <TableCell>{product.stock}</TableCell>
                                    <TableCell>
                                        <Typography
                                            variant="body2"
                                            fontWeight="medium"
                                            color={product.status === "Active" ? 'success.main' : 'error.main'}
                                        >
                                            {product.status}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Button
                                                variant="contained"
                                                size="small"
                                                color="primary"
                                                onClick={() => navigate(`/update-product/${product.productID}`)}
                                            >
                                                Edit
                                            </Button>
                                            <Button
                                                variant="contained"
                                                size="small"
                                                color="error"
                                                onClick={() => handleDeleteProduct(product.productID)}
                                            >
                                                Delete
                                            </Button>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                {products.length === 0 && (
                    <Typography sx={{ mt: 2 }} color="textSecondary">
                        No products available.
                    </Typography>
                )}

                {/* Payment List */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mt: 4,
                        mb: 2,
                        px: 2,
                    }}
                    ref={paymentsSectionRef}
                >
                    <Typography variant="h5" fontWeight="bold" color="text.primary">
                        Payments
                    </Typography>
                </Box>
                <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
                    <Table>
                        <TableHead sx={{ backgroundColor: 'primary.light' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Payment ID</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>User</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Amount Paid</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Payment Method</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {payments.map((payment) => (
                                <TableRow key={payment.paymentID} hover>
                                    <TableCell>{payment.paymentID}</TableCell>
                                    <TableCell>{`${payment.user?.firstName} ${payment.user?.lastName}`}</TableCell>
                                    <TableCell>${payment.amountPaid.toFixed(2)}</TableCell>
                                    <TableCell>{payment.paymentMethod}</TableCell>
                                    <TableCell>
                                        <Select
                                            value={payment.paymentStatus}
                                            onChange={(e) => handleUpdatePaymentStatus(payment.paymentID, e.target.value)}
                                            size="small"
                                            sx={{ width: "130px" }}
                                        >
                                            <MenuItem value="Pending">Pending</MenuItem>
                                            <MenuItem value="Completed">Completed</MenuItem>
                                            <MenuItem value="Cancelled">Cancelled</MenuItem>
                                            <MenuItem value="Failed">Failed</MenuItem>
                                        </Select>
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="contained"
                                            color="error"
                                            size="small"
                                            disabled={payment.paymentStatus !== "Cancelled"}
                                            onClick={() => handleDeletePayment(payment.paymentID, payment.paymentStatus)}
                                        >
                                            Delete
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                {payments.length === 0 && (
                    <Typography sx={{ mt: 2 }} color="textSecondary">
                        No payments available.
                    </Typography>
                )}

                {/* Order List */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mt: 4,
                        mb: 2,
                        px: 2,
                    }}
                    ref={ordersSectionRef}
                >
                    <Typography variant="h5" fontWeight="bold" color="text.primary">
                        Orders
                    </Typography>
                </Box>
                <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
                    <Table>
                        <TableHead sx={{ backgroundColor: 'primary.light' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Order ID</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>User</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Grand Total</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {orders.map((order) => (
                                <TableRow key={order.orderID} hover>
                                    <TableCell>{order.orderID}</TableCell>
                                    <TableCell>{`${order.user?.firstName} ${order.user?.lastName}`}</TableCell>
                                    <TableCell>${order.grandTotal.toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Select
                                            value={order.orderStatus}
                                            onChange={(e) => handleUpdateOrderStatus(order.orderID, e.target.value)}
                                            size="small"
                                            sx={{ width: "130px" }}
                                        >
                                            <MenuItem value="Pending">Pending</MenuItem>
                                            <MenuItem value="Completed">Completed</MenuItem>
                                            <MenuItem value="Cancelled">Cancelled</MenuItem>
                                        </Select>
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                onClick={() => handleViewOrder(order.orderID)}
                                            >
                                                View Order
                                            </Button>
                                            <Button
                                                color="error"
                                                variant="contained"
                                                size="small"
                                                disabled={order.orderStatus !== "Cancelled"}
                                                onClick={() => handleDeleteOrder(order.orderID, order.orderStatus)}
                                            >
                                                Delete
                                            </Button>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                {orders.length === 0 && (
                    <Typography sx={{ mt: 2 }} color="textSecondary">
                        No orders available.
                    </Typography>
                )}

                {/* Dialog for Viewing Order Details */}
                {selectedOrder && (
                    <Dialog open onClose={handleCloseDialog} fullWidth maxWidth="md">
                        <DialogTitle>Order Details</DialogTitle>
                        <DialogContent>
                            {loadingDetails ? (
                                <CircularProgress />
                            ) : (
                                <>
                                    <Typography variant="h6" sx={{ mt: 2 }}>User Details</Typography>
                                    <TableContainer
                                        component={Paper}
                                        sx={{ mt: 2, borderRadius: 2, boxShadow: 3 }}
                                    >
                                        <Table>
                                            <TableBody>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                                                    <TableCell>{`${selectedOrder?.user?.firstName || "N/A"} ${selectedOrder?.user?.lastName || "N/A"}`}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                                                    <TableCell>{selectedOrder?.user?.email || "N/A"}</TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </TableContainer>

                                    <Typography variant="h6" sx={{ mt: 2 }}>Payment Details</Typography>
                                    <TableContainer
                                        component={Paper}
                                        sx={{ mt: 2, borderRadius: 2, boxShadow: 3 }}
                                    >
                                        <Table>
                                            <TableBody>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Payment Method</TableCell>
                                                    <TableCell>{selectedOrder?.payment?.paymentMethod || "N/A"}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Address</TableCell>
                                                    <TableCell>{selectedOrder?.payment?.address || "N/A"}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Phone</TableCell>
                                                    <TableCell>{selectedOrder?.payment?.phoneNumber || "N/A"}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 'bold', color: 'red' }}>Amount Paid</TableCell>
                                                    <TableCell sx={{ color: "red", fontWeight: "bold" }}>
                                                        ${selectedOrder?.payment?.amountPaid?.toFixed(2) || "N/A"}
                                                    </TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </TableContainer>

                                    <Typography variant="h6" sx={{ mt: 2 }}>Order Items</Typography>
                                    <TableContainer
                                        component={Paper}
                                        sx={{ mt: 2, borderRadius: 2, boxShadow: 3 }}
                                    >
                                        <Table>
                                            <TableHead sx={{ backgroundColor: 'grey.100' }}>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Product</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Original Price</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Discount %</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Discounted Price</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Quantity</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
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
                                                        <TableCell colSpan={6} align="center">
                                                            No items in this order.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                                <TableRow>
                                                    <TableCell colSpan={5} align="right">
                                                        <strong>Grand Total</strong>
                                                    </TableCell>
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

                {/* Deliveries Section */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mt: 4,
                        mb: 2,
                        px: 2,
                    }}
                    ref={deliveriesSectionRef}
                >
                    <Typography variant="h5" fontWeight="bold" color="text.primary">
                        Deliveries
                    </Typography>
                </Box>
                <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
                    <Table>
                        <TableHead sx={{ backgroundColor: 'primary.light' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Delivery ID</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Order ID</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Address</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {deliveries.length > 0 ? (
                                deliveries.map((delivery) => (
                                    <TableRow key={delivery.deliveryID} hover>
                                        <TableCell>{delivery.deliveryID}</TableCell>
                                        <TableCell>{delivery.orderID}</TableCell>
                                        <TableCell>{delivery.address}</TableCell>
                                        <TableCell>
                                            <Select
                                                value={delivery.deliveryStatus}
                                                onChange={(e) =>
                                                    handleUpdateDeliveryStatus(delivery.deliveryID, e.target.value)
                                                }
                                                size="small"
                                                sx={{ width: '150px' }}
                                            >
                                                <MenuItem value="Pending">Pending</MenuItem>
                                                <MenuItem value="In_Transit">In Transit</MenuItem>
                                                <MenuItem value="Delivered">Delivered</MenuItem>
                                                <MenuItem value="Cancelled">Cancelled</MenuItem>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="contained"
                                                color="error"
                                                size="small"
                                                onClick={() => handleDeleteDelivery(delivery.deliveryID)}
                                            >
                                                Delete
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


                {/* Dialog for Viewing/Editing Delivery*/}
                {selectedDelivery && (
                    <Dialog open={!!selectedDelivery} onClose={handleCloseDialog} fullWidth>
                        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            Delivery Details
                            <Button onClick={handleCloseDialog} sx={{ minWidth: "auto", color: "red", fontSize: "18px" }}>

                            </Button>
                        </DialogTitle>
                        <DialogContent>
                            <Typography><strong>Order ID:</strong> {selectedDelivery.orderID}</Typography>

                            <Box sx={{ mt: 2 }}>
                                <TextField
                                    label="Update Address"
                                    value={updatedAddress}
                                    onChange={(e) => setUpdatedAddress(e.target.value)}
                                    sx={{ width: "100%", mb: 2 }}
                                />
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={() => handleUpdateDeliveryAddress(selectedDelivery.deliveryID, updatedAddress)}
                                    disabled={!updatedAddress || updatedAddress === selectedDelivery.address}
                                >
                                    Confirm Address Update
                                </Button>
                            </Box>

                            <Box sx={{ mt: 2 }}>
                                <Select
                                    value={updatedStatus}
                                    onChange={(e) => setUpdatedStatus(e.target.value)}
                                    sx={{ width: "100%", mb: 2 }}
                                >
                                    <MenuItem value="Pending">Pending</MenuItem>
                                    <MenuItem value="In_Transit">In Transit</MenuItem>
                                    <MenuItem value="Delivered">Delivered</MenuItem>
                                    <MenuItem value="Cancelled">Cancelled</MenuItem>
                                </Select>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={() => handleUpdateDeliveryStatus(selectedDelivery.deliveryID, updatedStatus)}
                                    disabled={!updatedStatus || updatedStatus === selectedDelivery.deliveryStatus}
                                >
                                    Confirm Status Update
                                </Button>
                            </Box>
                        </DialogContent>
                    </Dialog>
                )}

                {/* Refunds Section */}
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        mt: 4,
                        mb: 2,
                        px: 2,
                    }}
                    ref={refundsSectionRef}
                >
                    <Typography variant="h5" fontWeight="bold" color="text.primary">
                        Refunds
                    </Typography>
                </Box>
                {loading ? (
                    <CircularProgress />
                ) : refunds.length === 0 ? (
                    <Typography sx={{ textAlign: "center", mt: 4 }}>
                        No refunds found.
                    </Typography>
                ) : (
                    <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
                        <Table>
                            <TableHead sx={{ backgroundColor: 'primary.light' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Refund ID</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Order ID</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Amount</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Requested Date</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: 'white' }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {refunds.map((refund) => (
                                    <TableRow key={refund.refundID} hover>
                                        <TableCell>{refund.refundID}</TableCell>
                                        <TableCell>{refund.orderID}</TableCell>
                                        <TableCell>${refund.refundAmount.toFixed(2)}</TableCell>
                                        <TableCell>{new Date(refund.refundDate).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Select
                                                value={refund.refundStatus}
                                                onChange={(e) => handleUpdateRefundStatus(refund.refundID, e.target.value)}
                                                size="small"
                                                sx={{ width: "150px" }}
                                            >
                                                <MenuItem value="Pending">Pending</MenuItem>
                                                <MenuItem value="Completed">Completed</MenuItem>
                                                <MenuItem value="Rejected">Rejected</MenuItem>
                                            </Select>
                                        </TableCell>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                                <Button
                                                    variant="contained"
                                                    color="primary"
                                                    size="small"
                                                    onClick={() => fetchRefundDetails(refund.refundID, refund.orderID)}
                                                >
                                                    View Details
                                                </Button>
                                                <Button
                                                    variant="contained"
                                                    color="error"
                                                    size="small"
                                                    disabled={refund.refundStatus !== "Rejected"}
                                                    onClick={() => handleDeleteRefund(refund.refundID, refund.refundStatus)}
                                                >
                                                    Delete
                                                </Button>
                                            </Box>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}


                {/* View Refund Details Dialog */}
                {selectedRefunds && (
                    <Dialog open onClose={() => setSelectedRefunds(null)} fullWidth maxWidth="md">
                        <DialogTitle>Refund Details</DialogTitle>
                        <DialogContent>
                            {loadingDetails ? (
                                <CircularProgress />
                            ) : (
                                <>
                                    <Typography variant="h6" sx={{ mt: 2 }}>Refund Information</Typography>
                                    <TableContainer component={Paper} sx={{ mt: 2, borderRadius: 2, boxShadow: 3 }}>
                                        <Table>
                                            <TableBody>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Refund ID</TableCell>
                                                    <TableCell>{selectedRefunds.refundID}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Order ID</TableCell>
                                                    <TableCell>{selectedRefunds.orderID}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Reason</TableCell>
                                                    <TableCell>{selectedRefunds.refundReason || "No reason provided"}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                                    <TableCell>{selectedRefunds.refundStatus}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Refund Amount</TableCell>
                                                    <TableCell>${selectedRefunds.refundAmount.toFixed(2)}</TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </TableContainer>

                                    <Typography variant="h6" sx={{ mt: 2 }}>Order Items</Typography>
                                    <TableContainer component={Paper} sx={{ mt: 2, borderRadius: 2, boxShadow: 3 }}>
                                        <Table>
                                            <TableHead sx={{ backgroundColor: 'grey.100' }}>
                                                <TableRow>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Product</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Original Price</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Discount %</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Discounted Price</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Quantity</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {selectedRefunds?.items?.length > 0 ? (
                                                    selectedRefunds.items.map((item, index) => {
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
                                                        <TableCell colSpan={6} align="center">
                                                            No items in this order.
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                                <TableRow>
                                                    <TableCell colSpan={5} align="right">
                                                        <strong>Grand Total</strong>
                                                    </TableCell>
                                                    <TableCell>
                                                        <strong>
                                                            ${selectedRefunds?.items?.reduce((total, item) => {
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

                {/* Empty state handling */}
                {refunds.length === 0 && (
                    <Typography sx={{ mt: 2 }} color="textSecondary">
                        No refunds available.
                    </Typography>
                )}

                <ToastContainer />
            </Box>
        </Box>
    );
}

export default AdminDashboard;