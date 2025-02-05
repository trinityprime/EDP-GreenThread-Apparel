import { useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Box, Typography, TextField, Button, Grid } from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function VerifyOtp() {
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const otpInputs = useRef([]);
    const location = useLocation();
    const navigate = useNavigate();
    const email = location.state?.email;

    const handleChange = (index, value) => {
        if (/^\d?$/.test(value)) {
            const newOtp = [...otp];
            newOtp[index] = value;
            setOtp(newOtp);

            if (value && index < 5) {
                otpInputs.current[index + 1].focus();
            }
        }
    };

    const handlePaste = (e) => {
        const pasted = e.clipboardData.getData("text").trim();
        if (/^\d{6}$/.test(pasted)) {
            setOtp(pasted.split(""));
            otpInputs.current[5].focus();
        }
        e.preventDefault();
    };

    const handleVerifyOtp = async () => {
        const otpCode = otp.join("");

        if (otpCode.length !== 6) {
            toast.error("Please enter a 6-digit OTP.");
            return;
        }

        try {
            const response = await fetch(`http://localhost:5082/api/otp/verify?otpCode=${otpCode}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();
            if (response.ok) {
                toast.success("OTP verified successfully!");
                setTimeout(() => navigate("/reset-password", { state: { email } }), 1000);
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
                Verify OTP
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                Enter the 6-digit OTP sent to your email.
            </Typography>
            <Grid container spacing={1} justifyContent="center" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                    <Grid item key={index}>
                        <TextField
                            inputRef={(el) => (otpInputs.current[index] = el)}
                            value={digit}
                            onChange={(e) => handleChange(index, e.target.value)}
                            variant="outlined"
                            sx={{ width: 50, textAlign: "center" }}
                            inputProps={{ maxLength: 1, style: { textAlign: "center", fontSize: "1.5rem" } }}
                        />
                    </Grid>
                ))}
            </Grid>
            <Button
                fullWidth
                variant="contained"
                color="primary"
                sx={{ mt: 3 }}
                onClick={handleVerifyOtp}
            >
                Verify OTP
            </Button>
            <ToastContainer />
        </Box>
    );
}
