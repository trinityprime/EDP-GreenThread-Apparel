import React, { useContext, useState, useEffect, useRef } from 'react';
import {
    Box, Typography, TextField, Button, Select, MenuItem, IconButton,
    InputAdornment, Grid, Container, Paper, CardHeader
} from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as yup from 'yup';
import http from '../http';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import UserContext from '../contexts/UserContext';
import { Visibility, VisibilityOff } from '@mui/icons-material';

function Login() {
    const navigate = useNavigate();
    const { setUser } = useContext(UserContext);
    const [loginType, setLoginType] = useState("User");
    const [showPassword, setShowPassword] = useState(false);
    const [requires2FA, setRequires2FA] = useState(false);
    const [twoFACode, setTwoFACode] = useState(["", "", "", "", "", ""]);
    const [userEmail, setUserEmail] = useState("");
    const otpInputs = useRef([]);

    const [otpAttempts, setOtpAttempts] = useState(() => {
        const stored = localStorage.getItem("otpAttempts");
        return stored ? parseInt(stored, 10) : 0;
    });
    const [otpIsBlocked, setOtpIsBlocked] = useState(false);
    const [otpRemainingTime, setOtpRemainingTime] = useState(0);

    const formik = useFormik({
        initialValues: {
            email: "",
            password: ""
        },
        validationSchema: yup.object({
            email: yup.string().trim()
                .email('Enter a valid email')
                .max(50, 'Email must be at most 50 characters')
                .required('Email is required'),
            password: yup.string().trim()
                .min(8, 'Password must be at least 8 characters')
                .max(50, 'Password must be at most 50 characters')
                .required('Password is required')
        }),
        onSubmit: (data) => {
            // No login rate limiting here – OTP rate limiting is handled separately.
            const endpoint = loginType === "Admin" ? "/admin/login" : "/user/login";
            data.email = data.email.trim().toLowerCase();
            data.password = data.password.trim();

            http.post(endpoint, data)
                .then((res) => {
                    console.log("Login response:", res.data);
                    if (res.data.requires2FA) {
                        setRequires2FA(true);
                        setUserEmail(data.email);
                    } else {
                        handleLoginSuccess(res);
                    }
                })
                .catch((err) => handleLoginError(err));
        }
    });

    useEffect(() => {
        let interval;
        if (otpIsBlocked) {
            interval = setInterval(() => {
                setOtpRemainingTime((prev) => {
                    if (prev <= 1) {
                        clearInterval(interval);
                        setOtpIsBlocked(false);
                        setOtpAttempts(0);
                        localStorage.removeItem("otpAttempts");
                        localStorage.removeItem("otpBlockUntil");
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [otpIsBlocked]);


    const handleChange = (index, value) => {
        if (/^[0-9]?$/.test(value)) {
            const newCode = [...twoFACode];
            newCode[index] = value;
            setTwoFACode(newCode);

            if (value && index < 5) {
                otpInputs.current[index + 1].focus();
            }

            if (newCode.every((digit) => digit !== "")) {
                if (otpIsBlocked) {
                    toast.error(`Too many OTP attempts. Try again in ${otpRemainingTime}s.`);
                    return;
                }
                handle2FALogin(newCode.join(""));
            }
        }
    };

    const handle2FALogin = (code) => {
        if (otpIsBlocked) {
            toast.error(`Too many OTP attempts. Try again in ${otpRemainingTime}s.`);
            return;
        }
        http.post("/api/2fa/verify-login", {
            email: userEmail,
            code,
        })
            .then((res) => handleLoginSuccess(res))
            .catch((err) => {
                toast.error("Invalid or expired 2FA code. Please try again.");
                console.error("2FA verification failed:", err);
                setTwoFACode(["", "", "", "", "", ""]);
                otpInputs.current[0]?.focus();

                // Increment OTP attempts and persist in localStorage.
                setOtpAttempts(prev => {
                    const newAttempts = prev + 1;
                    localStorage.setItem("otpAttempts", newAttempts);
                    if (newAttempts >= 5) {
                        setOtpIsBlocked(true);
                        setOtpRemainingTime(30);
                        const blockUntil = Date.now() + 30000; // Block for 30 seconds.
                        localStorage.setItem("otpBlockUntil", blockUntil);
                        toast.error("Too many OTP attempts. Please try again in 30 seconds.");
                    }
                    return newAttempts;
                });
            });
    };

    const handleLoginSuccess = (res) => {
        const userData = res.data[loginType.toLowerCase()];
        localStorage.setItem("accessToken", res.data.accessToken);
        setUser(userData);

        if (loginType === "Admin") {
            navigate("/admin-dashboard");
        } else {
            navigate("/profile");
        }
    };

    const handleLoginError = (err) => {
        if (err.response) {
            toast.error(`${err.response.data.message}`);
        } else if (err.request) {
            toast.error("No response received from the server. Please try again later.");
        } else {
            toast.error(`Error: ${err.message}`);
        }
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 8 }}>
            <Paper elevation={6} sx={{ p: 4, borderRadius: 2 }}>
                <CardHeader
                    title="Welcome Back!"
                    titleTypographyProps={{ variant: 'h5', align: 'center', fontWeight: 'bold' }}
                    sx={{ mb: 2 }}
                />
                {!requires2FA ? (
                    <>
                        <Box sx={{ textAlign: 'center', mb: 2 }}>
                            <Typography variant="subtitle1" color="textSecondary">
                                Sign in to continue
                            </Typography>
                        </Box>
                        <Select
                            value={loginType}
                            onChange={(e) => setLoginType(e.target.value)}
                            fullWidth
                            sx={{ mb: 2 }}
                        >
                            <MenuItem value="User">User</MenuItem>
                            <MenuItem value="Admin">Admin</MenuItem>
                        </Select>
                        <Box component="form" onSubmit={formik.handleSubmit}>
                            <TextField
                                fullWidth
                                margin="dense"
                                label="Email"
                                name="email"
                                value={formik.values.email}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.email && Boolean(formik.errors.email)}
                                helperText={formik.touched.email && formik.errors.email}
                                sx={{ mb: 2 }}
                            />
                            <TextField
                                fullWidth
                                margin="dense"
                                label="Password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                value={formik.values.password}
                                onChange={formik.handleChange}
                                onBlur={formik.handleBlur}
                                error={formik.touched.password && Boolean(formik.errors.password)}
                                helperText={formik.touched.password && formik.errors.password}
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
                            <Button fullWidth variant="contained" type="submit" sx={{ mt: 2, py: 1.5 }}>
                                Login as {loginType}
                            </Button>
                            <Box sx={{ mt: 2, textAlign: 'center' }}>
                                <Link
                                    to="/request-otp"
                                    style={{ textDecoration: 'none', color: '#1976d2', fontWeight: 'light' }}
                                >
                                Forgot your password?
                                </Link>
                            </Box>
                            <Box sx={{ mt: 2, textAlign: 'center' }}>
                                <Link
                                    to="/register"
                                    style={{ textDecoration: 'none', color: '#1976d2', fontWeight: 'light' }}
                                >
                                    Dont have an account?
                                </Link>
                            </Box>
                        </Box>
                    </>
                ) : (
                    // 2FA Verification Form
                    <Box>
                        <Typography variant="subtitle2" color="textSecondary" align="center" sx={{ mt: 2 }}>
                            Enter the 6-digit OTP from your authenticator app:
                        </Typography>
                        <Grid container spacing={1} justifyContent="center" sx={{ mt: 1 }}>
                            {twoFACode.map((digit, index) => (
                                <Grid item key={index}>
                                    <TextField
                                        inputRef={(el) => (otpInputs.current[index] = el)}
                                        value={digit}
                                        onChange={(e) => handleChange(index, e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === "Backspace" && twoFACode[index] === "") {
                                                if (index > 0) {
                                                    otpInputs.current[index - 1].focus();
                                                }
                                            }
                                        }}
                                        variant="outlined"
                                        sx={{ width: 60, mx: 0.5 }}
                                        inputProps={{
                                            maxLength: 1,
                                            style: { textAlign: "center", fontSize: "1.5rem", padding: "10px" },
                                            pattern: "[0-9]*",
                                            inputMode: "numeric",
                                        }}
                                    />
                                </Grid>
                            ))}
                        </Grid>
                        <Button
                            fullWidth
                            variant="contained"
                            sx={{ mt: 2, py: 1.5 }}
                            onClick={() => handle2FALogin(twoFACode.join(""))}
                            disabled={otpIsBlocked}
                        >
                            {otpIsBlocked ? `Retry in ${otpRemainingTime}s` : "Verify Code"}
                        </Button>
                        <Button
                            fullWidth
                            variant="outlined"
                            sx={{ mt: 1, py: 1.5 }}
                            onClick={() => setRequires2FA(false)}
                        >
                            Back to Login
                        </Button>
                    </Box>
                )}
            </Paper>
            <ToastContainer />
        </Container>
    );
}

export default Login;
