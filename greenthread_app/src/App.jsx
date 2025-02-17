import "./App.css";
import { useState, useEffect } from "react";
import {
    Container,
    AppBar,
    Toolbar,
    Typography,
    Box,
    Button,
    IconButton,
    Menu,
    MenuItem,
} from "@mui/material";
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import MyTheme from "./themes/MyTheme";
import Tutorials from "./pages/Tutorials";
import Register from "./pages/Register";
import Login from "./pages/Login";
import http from "./http";
import UserContext from "./contexts/UserContext";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import UpdateUser from "./pages/UpdateUser";
import UpdateForm from "./pages/components/UpdateForm";
import CreateAdminForm from "./pages/components/CreateAdminForm";
import CreateUserForm from "./pages/components/CreateUserForm";
import NotAuthorized from "./pages/components/NotAuthorized";
import RequestOtp from "./pages/RequestOtp";
import VerifyOtp from "./pages/VerifyOtp";
import ResetPassword from "./pages/ResetPassword";
import ShoppingCart from "./pages/ShoppingCart";
import Order from "./pages/Order";
import Product from "./pages/Product";
import CreateProductForm from "./pages/components/CreateProductForm";
import UpdateProductForm from "./pages/components/UpdateProductForm";
import CreatePaymentForm from "./pages/components/CreatePaymentForm";
import Payment from "./pages/Payment";
import Delivery from "./pages/Delivery";
import CreateDeliveryForm from "./pages/components/CreateDeliveryForm";
import Refund from "./pages/Refund";
import CreateRefundForm from "./pages/components/CreateRefundForm";
import HomeScreen from "./pages/HomeScreen";
import Chatbot from "./pages/components/Chatbot";

// Importing icons from MUI Icons
import AccountCircle from "@mui/icons-material/AccountCircle";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import MoneyOffIcon from "@mui/icons-material/MoneyOff";
import PaymentIcon from "@mui/icons-material/Payment";
import StorefrontIcon from "@mui/icons-material/Storefront";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";

function App() {
    const [user, setUser] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);

    useEffect(() => {
        if (localStorage.getItem("accessToken")) {
            http.get("/user/auth").then((res) => {
                setUser(res.data.user);
            });
        }
    }, []);

    const logout = () => {
        localStorage.clear();
        window.location = "/home";
    };

    // Functions to handle the profile dropdown menu
    const handleMenu = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <UserContext.Provider value={{ user, setUser }}>
            <Router>
                <ThemeProvider theme={MyTheme}>
                    <AppBar position="static" className="AppBar">
                        <Container>
                            <Toolbar disableGutters>
                                <Link
                                    to="/home"
                                    style={{ textDecoration: "none", color: "inherit" }}
                                >
                                    <Typography variant="h6" component="div">
                                        GreenThreadApparel
                                    </Typography>
                                </Link>
                                <Box sx={{ flexGrow: 1 }}></Box>
                                {user ? (
                                    <>
                                        {/* Icon buttons for orders, deliveries, refunds, payments, products, shopping cart */}
                                        <IconButton
                                            color="inherit"
                                            component={Link}
                                            to="/orders"
                                            title="View Orders"
                                        >
                                            <ReceiptLongIcon />
                                        </IconButton>
                                        <IconButton
                                            color="inherit"
                                            component={Link}
                                            to="/deliveries"
                                            title="View Delivery"
                                        >
                                            <LocalShippingIcon />
                                        </IconButton>
                                        <IconButton
                                            color="inherit"
                                            component={Link}
                                            to="/refunds"
                                            title="View Refunds"
                                        >
                                            <MoneyOffIcon />
                                        </IconButton>
                                        <IconButton
                                            color="inherit"
                                            component={Link}
                                            to="/payments"
                                            title="View Payment"
                                        >
                                            <PaymentIcon />
                                        </IconButton>
                                        <IconButton
                                            color="inherit"
                                            component={Link}
                                            to="/products"
                                            title="View Products"
                                        >
                                            <StorefrontIcon />
                                        </IconButton>
                                        <IconButton
                                            color="inherit"
                                            component={Link}
                                            to="/shopping-cart"
                                            title="View Shopping Cart"
                                        >
                                            <ShoppingCartIcon />
                                        </IconButton>
                                        {/* Dropdown for profile-related actions */}
                                        <IconButton
                                            size="large"
                                            edge="end"
                                            color="inherit"
                                            onClick={handleMenu}
                                        >
                                            <AccountCircle />
                                        </IconButton>
                                        <Menu
                                            id="menu-appbar"
                                            anchorEl={anchorEl}
                                            anchorOrigin={{
                                                vertical: "top",
                                                horizontal: "right",
                                            }}
                                            keepMounted
                                            transformOrigin={{
                                                vertical: "top",
                                                horizontal: "right",
                                            }}
                                            open={Boolean(anchorEl)}
                                            onClose={handleClose}
                                        >
                                            {user?.role === "Admin" ? (
                                                <MenuItem
                                                    onClick={handleClose}
                                                    component={Link}
                                                    to="/admin-dashboard"
                                                >
                                                    View Dashboard
                                                </MenuItem>
                                            ) : (
                                                <MenuItem
                                                    onClick={handleClose}
                                                    component={Link}
                                                    to="/profile"
                                                >
                                                    View Profile
                                                </MenuItem>
                                            )}
                                            <MenuItem
                                                onClick={() => {
                                                    handleClose();
                                                    logout();
                                                }}
                                            >
                                                Logout
                                            </MenuItem>
                                        </Menu>
                                    </>
                                ) : (
                                    // If no user is logged in, show Login and Register
                                    <>
                                        <Button color="inherit" component={Link} to="/login">
                                            Login
                                        </Button>
                                        <Button color="inherit" component={Link} to="/register">
                                            Register
                                        </Button>
                                    </>
                                )}
                            </Toolbar>
                        </Container>
                    </AppBar>

                    <Container>
                        <Routes>
                            <Route path="/tutorials" element={<Tutorials />} />
                            <Route path="/" element={<Navigate to="/home" replace />} />
                            <Route path="/home" element={<HomeScreen />} />
                            <Route path="/register" element={<Register />} />
                            <Route path="/login" element={<Login />} />
                            <Route path="/admin-dashboard" element={<AdminDashboard />} />
                            <Route path="/profile" element={<Profile />} />
                            <Route path="/update-user" element={<UpdateUser />} />
                            <Route path="/update-user/:id" element={<UpdateForm type="user" />} />
                            <Route path="/update-admin/:id" element={<UpdateForm type="admin" />} />
                            <Route path="/create-admin" element={<CreateAdminForm />} />
                            <Route path="/create-user" element={<CreateUserForm />} />
                            <Route path="/not-authorized" element={<NotAuthorized />} />
                            <Route path="/request-otp" element={<RequestOtp />} />
                            <Route path="/verify-otp" element={<VerifyOtp />} />
                            <Route path="/reset-password" element={<ResetPassword />} />
                            <Route path="/shopping-cart" element={<ShoppingCart />} />
                            <Route path="/orders" element={<Order />} />
                            <Route path="/products" element={<Product />} />
                            <Route path="/create-product" element={<CreateProductForm />} />
                            <Route path="/update-product/:id" element={<UpdateProductForm />} />
                            <Route path="/create-payment" element={<CreatePaymentForm />} /> 
                            <Route path="/payments" element={<Payment />} /> 
                            <Route path="/deliveries" element={<Delivery />} /> 
                            <Route path="/deliveries/:orderID" element={<CreateDeliveryForm />} />
                            <Route path="/refunds" element={<Refund />} />
                            <Route path="/request-refund/:orderID" element={<CreateRefundForm />} />
                        </Routes>
                    </Container>

                    {/* Chatbot component added here */}
                    <Chatbot />

                </ThemeProvider>
            </Router>
        </UserContext.Provider>
    );
}

export default App;
