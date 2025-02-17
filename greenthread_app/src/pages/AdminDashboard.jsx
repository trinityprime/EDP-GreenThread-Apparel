import React, { useEffect, useState, useContext, useRef } from 'react';
import { Box, Typography, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Select, MenuItem, Dialog, DialogTitle, DialogContent, TextField } from '@mui/material';
import http from '../http';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import UserContext from '../contexts/UserContext';
import { useNavigate } from 'react-router-dom';

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
    const [loadingDetails, setLoadingDetails] = useState(false);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true); 

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
                .then((res) => {
                    setDeliveries(res.data);
                })
                .catch(() => toast.error("Failed to fetch delivery data."))
                .finally(() => setLoading(false));
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
            await http.put(`/api/Delivery/${id}/status`, newStatus, { // Send raw string
                headers: { "Content-Type": "application/json" },
            });

            toast.success(`Delivery ${id} updated to ${newStatus}`);
            setDeliveries((prevDeliveries) =>
                prevDeliveries.map((delivery) =>
                    delivery.deliveryID === id
                        ? { ...delivery, deliveryStatus: newStatus }
                        : delivery
                )
            );
        } catch (err) {
            toast.error("Failed to update delivery status.");
            console.error("Error updating delivery status:", err);
        }
    };
    ``

    const handleDeleteDelivery = async (id) => {
        try {
            await http.delete(`/api/Delivery/${id}`);
            toast.success("Delivery deleted successfully.");
            fetchDeliveries();
        } catch (err) {
            toast.error("Failed to delete delivery.");
        }
    };

   

   


    // Check if the admin is the super admin
    const isSuperAdmin = (admin) => {
        return admin.adminID === 1 && admin.email === 'superadmin@greenthread.com';
    };

    return (
        <Box sx={{ display: "flex", height: "70vh", paddingTop: "30px"}}>
            {/* Left Navigation Box */}
            <Box
                sx={{
                    width: 240,
                    backgroundColor: "#f9f9f9",
                    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)", // Outer shadow
                    border: "2px solid #e0e0e0", // Light border
                    borderRadius: "8px", // Slightly rounded corners
                    p: 2,
                    top: "10px", // Adds space between the top of the viewport and the box
                    mt: 2, // Adds some margin from the top
                    mb: 2, // Adds margin from the bottom
                }}
            >
                <Typography
                    variant="h6"
                    sx={{
                        textAlign: "center",
                        fontWeight: "bold",
                        textDecoration: "underline",
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
                            fontWeight: "bold",
                        }}
                        onClick={() => handleScrollToSection(section.ref)}
                    >
                        {section.name}
                    </Button>
                ))}
            </Box>

            <Box sx={{ mt: 4, mx: 'auto', maxWidth: '800px' }} ref={adminSectionRef}>
                <Typography variant="h4" sx={{ mb: 4 }} ref={adminSectionRef}>
                    Admin Dashboard
                </Typography>

                {/* Admin List */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }} ref={adminSectionRef}>
                    <Typography variant="h5">
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
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>Admin ID</strong></TableCell>
                                <TableCell><strong>Email</strong></TableCell>
                                <TableCell><strong>Status</strong></TableCell>
                                <TableCell><strong>Actions</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {admins.map((admin) => (
                                <TableRow key={admin.adminID}>
                                    <TableCell>{admin.adminID}</TableCell>
                                    <TableCell>{admin.email}</TableCell>
                                    <TableCell>
                                        {admin.isDeactivated ? "Deactivated" : "Active"}
                                    </TableCell>
                                    <TableCell>
                                        {/* Conditionally render buttons for non-super admin */}
                                        {!isSuperAdmin(admin) && (
                                            <>
                                                <Button
                                                    variant="contained"
                                                    sx={{
                                                        backgroundColor: admin.isDeactivated ? 'orange' : 'error.main',
                                                        mr: 2
                                                    }}
                                                    onClick={() => handleToggleActivation(admin.adminID, 'admin', admin.isDeactivated)}
                                                >
                                                    {admin.isDeactivated ? "Activate" : "Deactivate"}
                                                </Button>
                                                <Button
                                                    variant="contained"
                                                    color="primary"
                                                    onClick={() => handleUpdate(admin.adminID, 'admin')}
                                                >
                                                    Update
                                                </Button>
                                            </>
                                        )}
                                        {/* Display message for super admin */}
                                        {isSuperAdmin(admin) && (
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

                {/* User List */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 4, mb: 2 }} ref={userSectionRef}>
                    <Typography variant="h5">
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
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>User ID</strong></TableCell>
                                <TableCell><strong>First Name</strong></TableCell>
                                <TableCell><strong>Last Name</strong></TableCell>
                                <TableCell><strong>Email</strong></TableCell>
                                <TableCell><strong>Postal Code</strong></TableCell>
                                <TableCell><strong>Status</strong></TableCell>
                                <TableCell><strong>Actions</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.userID}>
                                    <TableCell>{user.userID}</TableCell>
                                    <TableCell>{user.firstName}</TableCell>
                                    <TableCell>{user.lastName}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{user.postalCode}</TableCell>
                                    <TableCell>
                                        {user.isDeactivated ? "Deactivated" : "Active"}
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="contained"
                                            sx={{
                                                backgroundColor: user.isDeactivated ? 'orange' : 'error.main',
                                                mr: 2
                                            }}
                                            onClick={() => handleToggleActivation(user.userID, 'user', user.isDeactivated)}
                                        >
                                            {user.isDeactivated ? "Activate" : "Deactivate"}
                                        </Button>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            onClick={() => handleUpdate(user.userID, 'user')}
                                        >
                                            Update
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Manage Products */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 4, mb: 2 }} ref={productsSectionRef}>
                    <Typography variant="h5">Products</Typography>
                    <Button variant="contained" color="primary" onClick={() => navigate("/create-product")}>
                        Create Product
                    </Button>
                </Box>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>Product ID</strong></TableCell>
                                <TableCell><strong>Name</strong></TableCell>
                                <TableCell><strong>Price</strong></TableCell>
                                <TableCell><strong>Stock</strong></TableCell>
                                <TableCell><strong>Status</strong></TableCell>
                                <TableCell><strong>Actions</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {products.map((product) => (
                                <TableRow key={product.productID}>
                                    <TableCell>{product.productID}</TableCell>
                                    <TableCell>{product.productName}</TableCell>
                                    <TableCell>${product.finalPrice.toFixed(2)}</TableCell>
                                    <TableCell>{product.stock}</TableCell>
                                    <TableCell>{product.status}</TableCell>
                                    <TableCell>
                                        <Button variant="contained" color="primary" onClick={() => navigate(`/update-product/${product.productID}`)}>
                                            Edit
                                        </Button>
                                        <Button variant="contained" color="error" sx={{ ml: 2 }} onClick={() => handleDeleteProduct(product.productID)}>
                                            Delete
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                {/* Empty state handling */}
                {products.length === 0 && (
                    <Typography sx={{ mt: 2 }} color="textSecondary">
                        No products available.
                    </Typography>
                )}

                {/* Payment List */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 4, mb: 2 }} ref={paymentsSectionRef}>
                    <Typography variant="h5">
                        Payments
                    </Typography>
                </Box>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>Payment ID</strong></TableCell>
                                <TableCell><strong>User</strong></TableCell>
                                <TableCell><strong>Amount Paid</strong></TableCell>
                                <TableCell><strong>Payment Method</strong></TableCell>
                                <TableCell><strong>Status</strong></TableCell>
                                <TableCell><strong>Actions</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {payments.map((payment) => (
                                <TableRow key={payment.paymentID}>
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
                                            color="error"
                                            variant="contained"
                                            disabled={payment.paymentStatus !== "Cancelled"} // Disable if not "Cancelled"
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

                {/* Empty state handling */}
                {payments.length === 0 && (
                    <Typography sx={{ mt: 2 }} color="textSecondary">
                        No payments available.
                    </Typography>
                )}

                {/* Order List */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 4, mb: 2 }} ref={ordersSectionRef}>
                    <Typography variant="h5">
                        Orders
                    </Typography>
                </Box>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>Order ID</strong></TableCell>
                                <TableCell><strong>User</strong></TableCell>
                                <TableCell><strong>Grand Total</strong></TableCell>
                                <TableCell><strong>Status</strong></TableCell>
                                <TableCell><strong>Actions</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {orders.map((order) => (
                                <TableRow key={order.orderID}>
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
                                        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                                            <Button variant="outlined" onClick={() => handleViewOrder(order.orderID)}>
                                                View Order
                                            </Button>
                                            <Button
                                                color="error"
                                                variant="contained"
                                                disabled={order.orderStatus !== "Cancelled"} // Disable if not "Cancelled"
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

                {/* Empty state handling */}
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

                {/* Delivery List */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 4, mb: 2 }} ref={deliveriesSectionRef}>
                    <Typography variant="h5">
                        Deliveries
                    </Typography>
                </Box>

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
                                        <TableCell>
                                            <Select
                                                value={delivery.deliveryStatus}
                                                onChange={(e) => handleUpdateDeliveryStatus(delivery.deliveryID, e.target.value)}
                                                size="small"
                                                sx={{ width: "150px" }}
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
                                                onClick={() => handleDeleteDelivery(delivery.deliveryID)}
                                                sx={{ ml: 2 }}
                                            >
                                                Delete
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={6} align="center">
                                        No deliveries available.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>


             

                // Dialog for Viewing/Editing Delivery
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

                


             

                {/* Refund List */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 4, mb: 2 }} ref={refundsSectionRef}>
                    <Typography variant="h5">
                        Refunds
                    </Typography>
                </Box>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>Refund ID</strong></TableCell>
                                <TableCell><strong>User</strong></TableCell>
                                <TableCell><strong>Grand Total</strong></TableCell>
                                <TableCell><strong>Status</strong></TableCell>
                                <TableCell><strong>Actions</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            nothing
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Empty state handling */}
                {/*{deliveries.length === 0 && (*/}
                {/*    <Typography sx={{ mt: 2 }} color="textSecondary">*/}
                {/*        No deliveries available.*/}
                {/*    </Typography>*/}
                {/*)}*/}

                <ToastContainer />
            </Box>
        </Box>
    );
}

export default AdminDashboard;