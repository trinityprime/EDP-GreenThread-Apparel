import { useState } from "react";
import { Box, Typography, TextField, Button } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function RequestOtp() {
    const [email, setEmail] = useState("");
    const [emailError, setEmailError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.trim()) return "Email is required.";
        if (!emailRegex.test(email)) return "Enter a valid email address.";
        return "";
    };

    const handleChange = (e) => {
        setEmail(e.target.value);
        setEmailError(validateEmail(e.target.value));
    };

    const handleRequestOtp = async () => {
        const error = validateEmail(email);
        if (error) {
            setEmailError(error);
            return;
        }

        setLoading(true);

        try {
            const response = await fetch("http://localhost:5082/api/otp/request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();
            if (response.ok) {
                toast.success("OTP sent successfully!");
                setTimeout(() => navigate("/verify-otp", { state: { email } }), 1000);
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ maxWidth: 400, mx: "auto", mt: 8, textAlign: "center" }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
                Request OTP
            </Typography>
            <TextField
                fullWidth
                label="Enter your email"
                variant="outlined"
                value={email}
                onChange={handleChange}
                error={Boolean(emailError)}
                helperText={emailError}
                sx={{ mb: 2 }}
            />
            <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={handleRequestOtp}
                disabled={loading}
            >
                {loading ? "Requesting..." : "Request OTP"}
            </Button>
            <ToastContainer />
        </Box>
    );
}
