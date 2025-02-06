import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Box, Typography, TextField, Button, IconButton, InputAdornment, FormHelperText } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";

export default function ResetPassword() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");
    const [confirmPasswordError, setConfirmPasswordError] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const email = location.state?.email;

    const validatePassword = (password) => {
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,50}$/;
        return passwordRegex.test(password)
            ? ""
            : "Password must be 8-50 characters, include 1 uppercase letter, 1 number, and 1 special character.";
    };

    const handlePasswordChange = (e) => {
        const value = e.target.value;
        setPassword(value);
        setPasswordError(validatePassword(value));
    };

    const handleConfirmPasswordChange = (e) => {
        const value = e.target.value;
        setConfirmPassword(value);
        setConfirmPasswordError(value !== password ? "Passwords do not match" : "");
    };

    const handleResetPassword = async () => {
        if (passwordError || confirmPasswordError || !password || !confirmPassword) return;

        try {
            const response = await fetch("http://localhost:5082/user/reset-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();
            if (response.ok) {
                navigate("/login");
            } else {
                setPasswordError(data.message);
            }
        } catch (error) {
            setPasswordError("Something went wrong. Please try again.");
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
                onChange={handlePasswordChange}
                fullWidth
                variant="outlined"
                error={!!passwordError}
                helperText={passwordError}
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
                onChange={handleConfirmPasswordChange}
                fullWidth
                variant="outlined"
                error={!!confirmPasswordError}
                helperText={confirmPasswordError}
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
                disabled={!!passwordError || !!confirmPasswordError || !password || !confirmPassword}
            >
                Reset Password
            </Button>
        </Box>
    );
}
