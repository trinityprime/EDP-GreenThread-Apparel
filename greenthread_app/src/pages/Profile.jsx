import React, { useContext, useState, useRef } from "react";
import {
    Box,
    Container,
    Grid,
    Paper,
    Typography,
    Button,
    Stack,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    TextField,
    Divider,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "../http";
import { QRCodeSVG } from "qrcode.react";
import UserContext from "../contexts/UserContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function Profile() {
    const { user, setUser } = useContext(UserContext);
    const navigate = useNavigate();

    // Dialog states and others
    const [password, setPassword] = useState("");
    const [openPasswordDialog, setOpenPasswordDialog] = useState(false);
    const [actionType, setActionType] = useState("");
    const [openDeactivateDialog, setOpenDeactivateDialog] = useState(false);
    const [open2FA, setOpen2FA] = useState(false);
    const [qrData, setQrData] = useState(null);
    // Store each 2FA digit as an element in an array (6 boxes)
    const [verificationCodeDigits, setVerificationCodeDigits] = useState(Array(6).fill(""));
    const [disable2FAOpen, setDisable2FAOpen] = useState(false);
    const [backupCodes, setBackupCodes] = useState([]);
    const [error, setError] = useState("");

    // To manage focus for each input box
    const inputRefs = useRef([]);

    const handleUpdateClick = () => navigate("/update-user");

    const handleDeactivateClick = () => setOpenDeactivateDialog(true);

    const handleCloseDeactivate = () => setOpenDeactivateDialog(false);

    const handleConfirmDeactivate = () => {
        axios
            .put(`/user/deactivate/${user.userID}`)
            .then(() => {
                setUser(null);
                localStorage.clear();
                navigate("/login");
            })
            .catch((error) => {
                console.error("Error deactivating user:", error);
            });
    };

    // Modified verify function to accept the auto-joined 6-digit code
    const handleVerify2FA = (codeFromDigits) => {
        const code = codeFromDigits || verificationCodeDigits.join("");
        axios
            .post(
                "/api/2fa/verify",
                { password, code },
                {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                }
            )
            .then((res) => {
                setOpen2FA(false);
                setError("");
                setUser({ ...user, isTwoFactorEnabled: true });
                setBackupCodes(res.data.recoveryCodes);
                toast.success("2FA Enabled! Please save your backup codes.");
                // Reset the code boxes for future use
                setVerificationCodeDigits(Array(6).fill(""));
            })
            .catch((error) => {
                console.error("Error verifying 2FA:", error);
                setError("Invalid verification code. Please try again.");
            });
    };

    const handlePasswordSubmit = () => {
        if (actionType === "enable") {
            axios
                .post(
                    "/api/2fa/enable",
                    { password },
                    {
                        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                    }
                )
                .then((response) => {
                    setQrData(response.data);
                    setOpen2FA(true);
                    setOpenPasswordDialog(false);
                })
                .catch((error) => {
                    console.error("Error enabling 2FA:", error);
                    setError("Invalid password or failed to enable 2FA.");
                });
        } else if (actionType === "disable") {
            axios
                .post(
                    "/api/2fa/disable",
                    { password },
                    {
                        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                    }
                )
                .then(() => {
                    setUser({ ...user, isTwoFactorEnabled: false });
                    setOpenPasswordDialog(false);
                    toast.info("2FA has been disabled!");
                })
                .catch((error) => {
                    console.error("Error disabling 2FA:", error);
                    setError("Invalid password or failed to disable 2FA.");
                });
        }
    };

    const requestPassword = (type) => {
        setActionType(type);
        setPassword("");
        setOpenPasswordDialog(true);
    };

    const confirmDisable2FA = () => {
        axios
            .post(
                "/api/2fa/disable",
                {},
                {
                    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
                }
            )
            .then(() => {
                setUser({ ...user, isTwoFactorEnabled: false });
                setDisable2FAOpen(false);
                toast.info("2FA has been disabled!");
            })
            .catch((error) => {
                console.error("Error disabling 2FA:", error);
                setError("Failed to disable 2FA.");
            });
    };

    // Update the specific digit in the verification code array
    const handleDigitChange = (index, e) => {
        const value = e.target.value;
        if (!/^\d*$/.test(value)) return; // Only digits allowed
        const digit = value.slice(-1); // Ensure one digit only
        setVerificationCodeDigits((prev) => {
            const newDigits = [...prev];
            newDigits[index] = digit;
            // Automatically focus next input if available
            if (digit && index < 5) {
                inputRefs.current[index + 1].focus();
            }
            // Auto-submit if all boxes are filled
            if (newDigits.every((d) => d !== "")) {
                const code = newDigits.join("");
                setTimeout(() => {
                    handleVerify2FA(code);
                }, 100);
            }
            return newDigits;
        });
    };

    // Handle backspace to move to previous box when empty
    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace" && !verificationCodeDigits[index] && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    // Copy backup codes to clipboard
    const handleCopyBackupCodes = () => {
        const codesText = backupCodes.join("\n");
        navigator.clipboard
            .writeText(codesText)
            .then(() => {
                toast.success("Backup codes copied to clipboard!");
            })
            .catch(() => {
                toast.error("Failed to copy backup codes");
            });
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
            <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
                <Typography variant="h4" align="center" gutterBottom>
                    My Profile
                </Typography>
                <Divider sx={{ my: 3 }} />
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle1" color="textSecondary">
                            First Name
                        </Typography>
                        <Typography variant="body1">{user.firstName}</Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <Typography variant="subtitle1" color="textSecondary">
                            Last Name
                        </Typography>
                        <Typography variant="body1">{user.lastName}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="subtitle1" color="textSecondary">
                            Email
                        </Typography>
                        <Typography variant="body1">{user.email}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="subtitle1" color="textSecondary">
                            Postal Code
                        </Typography>
                        <Typography variant="body1">{user.postalCode}</Typography>
                    </Grid>
                    <Grid item xs={12}>
                        <Typography variant="subtitle1" color="textSecondary">
                            Two-Factor Authentication
                        </Typography>
                        <Typography variant="body1">
                            {user.isTwoFactorEnabled ? "Enabled" : "Disabled"}
                        </Typography>
                    </Grid>
                </Grid>
                <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 4 }}>
                    <Button variant="contained" color="primary" onClick={handleUpdateClick}>
                        Update Profile
                    </Button>
                    <Button variant="contained" color="error" onClick={handleDeactivateClick}>
                        Deactivate Account
                    </Button>
                    <Button
                        variant="contained"
                        color={user.isTwoFactorEnabled ? "warning" : "info"}
                        onClick={() =>
                            requestPassword(user.isTwoFactorEnabled ? "disable" : "enable")
                        }
                    >
                        {user.isTwoFactorEnabled ? "Disable 2FA" : "Enable 2FA"}
                    </Button>
                </Stack>
            </Paper>

            {/* Password Dialog */}
            <Dialog open={openPasswordDialog} onClose={() => setOpenPasswordDialog(false)}>
                <DialogTitle>Authenticate</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Please enter your password to{" "}
                        {actionType === "enable" ? "enable" : "disable"} Two-Factor Authentication.
                    </DialogContentText>
                    <TextField
                        autoFocus
                        fullWidth
                        label="Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        sx={{ mt: 2 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenPasswordDialog(false)}>Cancel</Button>
                    <Button onClick={handlePasswordSubmit} color="primary">
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>

            {/* 2FA Setup Dialog */}
            <Dialog open={open2FA} onClose={() => setOpen2FA(false)}>
                <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Scan the QR code below using your authenticator app.
                    </DialogContentText>
                    {qrData && (
                        <Box sx={{ textAlign: "center", mt: 2 }}>
                            <QRCodeSVG value={qrData.qrCodeUri} size={200} />
                        </Box>
                    )}
                    <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" color="textSecondary">
                            Enter the 6-digit OTP from your authenticator app:
                        </Typography>
                    </Box>
                    <Box sx={{ display: "flex", justifyContent: "center", mt: 2, gap: 1 }}>
                        {verificationCodeDigits.map((digit, index) => (
                            <TextField
                                key={index}
                                value={digit}
                                onChange={(e) => handleDigitChange(index, e)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                inputProps={{
                                    maxLength: 1,
                                    style: { textAlign: "center", fontSize: "1.5rem" },
                                }}
                                sx={{ width: "3rem" }}
                                variant="outlined"
                                autoFocus={index === 0}
                                inputRef={(el) => (inputRefs.current[index] = el)}
                            />
                        ))}
                    </Box>
                    {error && (
                        <Typography color="error" sx={{ mt: 2 }}>
                            {error}
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen2FA(false)}>Cancel</Button>
                </DialogActions>
            </Dialog>

            {/* Backup Codes Dialog */}
            <Dialog open={backupCodes.length > 0} onClose={() => setBackupCodes([])}>
                <DialogTitle>Backup Codes</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Save these codes securely. Each code can be used once:
                    </DialogContentText>
                    <Grid container spacing={2} sx={{ mt: 2 }}>
                        {backupCodes.map((code, index) => (
                            <Grid item xs={6} sm={4} key={index}>
                                <Paper
                                    variant="outlined"
                                    sx={{
                                        p: 1,
                                        textAlign: "center",
                                        fontFamily: "monospace",
                                        backgroundColor: "#f9f9f9",
                                    }}
                                >
                                    {code}
                                </Paper>
                            </Grid>
                        ))}
                    </Grid>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCopyBackupCodes}>Copy All</Button>
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
                    <Button onClick={confirmDisable2FA} color="warning">
                        Disable
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Deactivate Account Dialog */}
            <Dialog
                open={openDeactivateDialog}
                onClose={handleCloseDeactivate}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">Confirm Deactivation</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Are you sure you want to deactivate your account? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDeactivate} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleConfirmDeactivate} color="secondary" autoFocus>
                        Deactivate
                    </Button>
                </DialogActions>
            </Dialog>

            <ToastContainer position="top-right" autoClose={3000} hideProgressBar />
        </Container>
    );
}

export default Profile;
