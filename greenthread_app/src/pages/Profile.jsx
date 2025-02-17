import React, { useContext, useState } from "react";
import { Box, Typography, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField } from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "../http";
import UserContext from "../contexts/UserContext";
import { QRCodeSVG } from "qrcode.react";

function Profile() {
    const { user, setUser } = useContext(UserContext);
    const [open, setOpen] = useState(false);
    const [open2FA, setOpen2FA] = useState(false); // For 2FA dialog
    const [qrData, setQrData] = useState(null); // Stores QR code data
    const [verificationCode, setVerificationCode] = useState(""); // For 2FA verification
    const [disable2FAOpen, setDisable2FAOpen] = useState(false);
    const [backupCodes, setBackupCodes] = useState([]);
    const [error, setError] = useState(""); // For error messages
    const navigate = useNavigate();

    // Existing functions...
    const handleUpdateClick = () => navigate("/update-user");
    const handleShoppingCartClick = () => navigate("/shopping-cart");
    const handleOrdersClick = () => navigate("/orders");
    const handleViewProductsClick = () => navigate("/products");
    const handleDeliveriesClick = () => navigate("/deliveries");
    const handleRefundsClick = () => navigate("/refunds");
    const handleDeactivateClick = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const handleConfirmDeactivate = () => {
        axios.put(`/user/deactivate/${user.userID}`)
            .then(() => {
                setUser(null);
                localStorage.clear();
                navigate("/login");
            })
            .catch((error) => {
                console.error("Error deactivating user:", error);
            });
    };

    // Enable 2FA
    const handleEnable2FA = () => {
        axios.post("/api/2fa/enable", {}, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        })
            .then((response) => {
                setQrData(response.data);
                setOpen2FA(true);
            })
            .catch((error) => {
                console.error("Error enabling 2FA:", error);
                setError("Failed to enable 2FA. Please try again.");
            });
    };

    // Verify 2FA setup
    const handleVerify2FA = () => {
        axios.post("/api/2fa/verify", { code: verificationCode }, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        })
            .then((res) => {
                setOpen2FA(false);
                setError("");
                setUser({ ...user, isTwoFactorEnabled: true });
                setBackupCodes(res.data.recoveryCodes);
                alert("2FA Enabled! Please save your backup codes.");
            })
            .catch((error) => {
                console.error("Error verifying 2FA:", error);
                setError("Invalid verification code. Please try again.");
            });
    };

    const handleDisable2FA = () => {
        setDisable2FAOpen(true);
    };

    const confirmDisable2FA = () => {
        axios.post("/api/2fa/disable", {}, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        })
            .then(() => {
                setUser({ ...user, isTwoFactorEnabled: false });
                setDisable2FAOpen(false);
                alert("2FA has been disabled!");
            })
            .catch((error) => {
                console.error("Error disabling 2FA:", error);
                setError("Failed to disable 2FA.");
            });
    };

    return (
        <Box sx={{ mt: 4, mx: "auto", maxWidth: "500px" }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
                Profile
            </Typography>
            <Typography variant="body1"><strong>First Name:</strong> {user.firstName}</Typography>
            <Typography variant="body1"><strong>Last Name:</strong> {user.lastName}</Typography>
            <Typography variant="body1"><strong>Email:</strong> {user.email}</Typography>
            <Typography variant="body1"><strong>Postal Code:</strong> {user.postalCode}</Typography>
            <Typography variant="body1"><strong>2FA Status:</strong> {user.isTwoFactorEnabled ? "Enabled" : "Disabled"}</Typography>

            <Button variant="contained" color="primary" sx={{ mt: 2 }} onClick={handleUpdateClick}>
                Update Profile
            </Button>

            <Button variant="contained" color="secondary" sx={{ mt: 2, ml: 2 }} onClick={handleShoppingCartClick}>
                View Shopping Cart
            </Button>

            <Button variant="contained" color="primary" sx={{ mt: 2, ml: 2 }} onClick={handleOrdersClick}>
                View My Orders
            </Button>

            <Button variant="contained" color="success" sx={{ mt: 2, ml: 2 }} onClick={handleViewProductsClick}>
                View Products
            </Button>

            <Button variant="contained" color="success" sx={{ mt: 2, ml: 2 }} onClick={handleDeliveriesClick}>
                View My Deliveries
            </Button>

            <Button variant="contained" color="success" sx={{ mt: 2, ml: 2 }} onClick={handleRefundsClick}>
                View My Refunds
            </Button>

            <Button variant="contained" color="error" sx={{ mt: 2, ml: 2 }} onClick={handleDeactivateClick}>
                Deactivate Account
            </Button>

            {/* Enable 2FA Button */}
            <Button
                variant="contained"
                color={user.isTwoFactorEnabled ? "warning" : "info"}
                sx={{ mt: 2, ml: 2 }}
                onClick={user.isTwoFactorEnabled ? handleDisable2FA : handleEnable2FA}
            >
                {user.isTwoFactorEnabled ? "Disable 2FA" : "Enable 2FA"}
            </Button>

            {/* 2FA Setup Dialog */}
            <Dialog open={open2FA} onClose={() => setOpen2FA(false)}>
                <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Scan the QR code below using Microsoft Authenticator.
                    </DialogContentText>
                    {qrData && (
                        <Box sx={{ textAlign: "center", mt: 2 }}>
                            <QRCodeSVG value={qrData.qrCodeUri} size={200} />
                            <Typography variant="body2" sx={{ mt: 2 }}>
                                Secret: {qrData.secret}
                            </Typography>
                        </Box>
                    )}
                    <TextField
                        fullWidth
                        label="Verification Code"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        sx={{ mt: 2 }}
                    />
                    {error && (
                        <Typography color="error" sx={{ mt: 2 }}>
                            {error}
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen2FA(false)}>Cancel</Button>
                    <Button onClick={handleVerify2FA} color="primary">
                        Verify
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Backup Codes Dialog */}
            <Dialog open={backupCodes.length > 0} onClose={() => setBackupCodes([])}>
                <DialogTitle>Backup Codes</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Save these codes securely. Each code can be used once:
                    </DialogContentText>
                    <Box sx={{ mt: 2 }}>
                        {backupCodes.map((code, index) => (
                            <Typography key={index} variant="body2">{code}</Typography>
                        ))}
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setBackupCodes([])}>Close</Button>
                </DialogActions>
            </Dialog>

            {/* Disable 2FA Confirmation Dialog */}
            <Dialog open={disable2FAOpen} onClose={() => setDisable2FAOpen(false)}>
                <DialogTitle>Disable Two-Factor Authentication?</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Disabling 2FA reduces your account security. Are you sure?
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDisable2FAOpen(false)}>Cancel</Button>
                    <Button onClick={confirmDisable2FA} color="warning">Disable</Button>
                </DialogActions>
            </Dialog>

            {/* Deactivate Account Dialog */}
            <Dialog
                open={open}
                onClose={handleClose}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">{"Confirm Deactivation"}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Are you sure you want to deactivate your account? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleConfirmDeactivate} color="secondary" autoFocus>
                        Deactivate
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}

export default Profile;