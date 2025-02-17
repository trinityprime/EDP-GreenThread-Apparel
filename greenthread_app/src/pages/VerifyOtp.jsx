import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Box, Typography, TextField, Button, Grid } from "@mui/material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function VerifyOtp() {
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [resendLoading, setResendLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);
    const [attempts, setAttempts] = useState(0);
    const [isBlocked, setIsBlocked] = useState(false);
    const [remainingTime, setRemainingTime] = useState(0);
    const otpInputs = useRef([]);
    const location = useLocation();
    const navigate = useNavigate();
    const email = location.state?.email;

    useEffect(() => {
        if (otp.every(digit => digit !== "") && !isBlocked) {
            handleVerifyOtp();
        }
    }, [otp]);

    useEffect(() => {
        if (attempts >= 5) {
            setIsBlocked(true);
            setRemainingTime(30);
            toast.error("Too many attempts. Please try again in 30 seconds.");

            const interval = setInterval(() => {
                setRemainingTime((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        setIsBlocked(false);
                        setAttempts(0);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
    }, [attempts]);

    useEffect(() => {
        if (resendCooldown > 0) {
            const interval = setInterval(() => {
                setResendCooldown((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
    }, [resendCooldown]);

    const handleChange = (index, value) => {
        if (/^[0-9]?$/.test(value)) {
            const newOtp = [...otp];
            newOtp[index] = value;
            setOtp(newOtp);

            if (value && index < 5) {
                otpInputs.current[index + 1].focus();
            }
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === "Backspace" && !otp[index] && index > 0) {
            otpInputs.current[index - 1].focus();
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
        if (isBlocked) {
            toast.error(`Too many attempts. Please try again in ${remainingTime} seconds.`);
            return;
        }

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
                setAttempts(prev => prev + 1);
                setOtp(["", "", "", "", "", ""]);
                otpInputs.current[0]?.focus();
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Something went wrong. Please try again.");
        }
    };

    const handleResendOtp = async () => {
        if (resendCooldown > 0) {
            toast.error(`Please wait ${resendCooldown} seconds before resending.`);
            return;
        }
        setResendLoading(true);
        setResendCooldown(10);

        try {
            const response = await fetch("http://localhost:5082/api/otp/request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();
            if (response.ok) {
                toast.success("OTP resent successfully!");
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Something went wrong. Please try again.");
        } finally {
            setResendLoading(false);
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
                            onKeyDown={(e) => handleKeyDown(index, e)}
                            variant="outlined"
                            sx={{ width: 50, textAlign: "center" }}
                            inputProps={{ maxLength: 1, style: { textAlign: "center", fontSize: "1.5rem" }, pattern: "[0-9]*", inputMode: "numeric" }}
                        />
                    </Grid>
                ))}
            </Grid>
            <Button
                fullWidth
                variant="contained"
                color="primary"
                sx={{ mt: 2 }}
                onClick={handleResendOtp}
                disabled={resendLoading || resendCooldown > 0}
            >
                {resendCooldown > 0 ? `Resend OTP (${resendCooldown}s)` : "Resend OTP"}
            </Button>
            <ToastContainer />
        </Box>
    );
}