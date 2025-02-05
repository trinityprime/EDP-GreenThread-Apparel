import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Box, Typography, TextField, Button, IconButton, InputAdornment } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function ResetPassword() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const email = location.state?.email;

    const validatePassword = (password) => {
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,50}$/;
        if (!passwordRegex.test(password)) {
            return "Password must be 8-50 characters, include 1 uppercase letter, 1 number, and 1 special character.";
        }
        return null;
    };

    const handleResetPassword = async () => {
        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        const validationError = validatePassword(password);
        if (validationError) {
            toast.error(validationError);
            return;
        }

        try {
            const response = await fetch("http://localhost:5082/user/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();
            if (response.ok) {
                toast.success("Password reset successful!");
                setTimeout(() => navigate("/login"), 1000);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Something went wrong. Please try again.");
        }
    };

    return (
        <Box sx={{ maxWidth: 400, mx: "auto", mt: 8, textAlign: "center" }}>
            <Typography variant="h5" sx={{ mb: 1 }}>
                Reset Password
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Enter a strong password. You cannot reuse the last 3 passwords.
            </Typography>
            <TextField
                type={showPassword ? "text" : "password"}
                label="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                fullWidth
                variant="outlined"
                sx={{ mb: 2 }}
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                {showPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                        </InputAdornment>
                    ),
                }}
            />
            <TextField
                type={showConfirmPassword ? "text" : "password"}
                label="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                fullWidth
                variant="outlined"
                sx={{ mb: 3 }}
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                                {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                        </InputAdornment>
                    ),
                }}
            />
            <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={handleResetPassword}
            >
                Reset Password
            </Button>
            <ToastContainer />
        </Box>
    );
}
