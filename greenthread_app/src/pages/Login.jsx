import React, { useContext, useState, useEffect, useRef } from 'react';
import { Box, Typography, TextField, Button, Select, MenuItem, IconButton, InputAdornment, Grid } from '@mui/material';
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
    const [attempts, setAttempts] = useState(0);
    const [isBlocked, setIsBlocked] = useState(false);
    const [remainingTime, setRemainingTime] = useState(0);
    const otpInputs = useRef([]);

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
            if (isBlocked) {
                toast.error(`Too many attempts. Try again in ${remainingTime}s.`);
                return;
            }

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
                        // Handle normal login
                        handleLoginSuccess(res);
                    }
                })
                .catch((err) => handleLoginError(err));
        }
    });

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

    const handleChange = (index, value) => {
        if (/^[0-9]?$/.test(value)) {
            const newCode = [...twoFACode];
            newCode[index] = value;
            setTwoFACode(newCode);

            if (value && index < 5) {
                otpInputs.current[index + 1].focus();
            }

            if (newCode.every((digit) => digit !== "")) {
                handle2FALogin(newCode.join(""));
            }
        }
    };

    const handle2FALogin = (code) => {
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
        setAttempts(prev => prev + 1); 

        if (err.response) {
            toast.error(`${err.response.data.message}`);
        } else if (err.request) {
            toast.error("No response received from the server. Please try again later.");
        } else {
            toast.error(`Error: ${err.message}`);
        }
    };

    return (
        <Box sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
        }}>
            <Typography variant="h5" sx={{ my: 2 }}>
                Login
            </Typography>

            {!requires2FA ? (
                <>
                    <Select
                        value={loginType}
                        onChange={(e) => setLoginType(e.target.value)}
                        sx={{ mb: 2, width: '100%', maxWidth: 500 }}
                    >
                        <MenuItem value="User">User</MenuItem>
                        <MenuItem value="Admin">Admin</MenuItem>
                    </Select>
                    <Box component="form" sx={{ maxWidth: '500px' }} onSubmit={formik.handleSubmit}>
                        <TextField
                            fullWidth margin="dense" autoComplete="off"
                            label="Email"
                            name="email"
                            value={formik.values.email}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.email && Boolean(formik.errors.email)}
                            helperText={formik.touched.email && formik.errors.email}
                        />
                        <TextField
                            fullWidth margin="dense" autoComplete="off"
                            label="Password"
                            name="password" type={showPassword ? "text" : "password"}
                            value={formik.values.password}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur}
                            error={formik.touched.password && Boolean(formik.errors.password)}
                            helperText={formik.touched.password && formik.errors.password}
                            InputProps={{
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                            aria-label="toggle password visibility"
                                            onClick={() => setShowPassword(!showPassword)}
                                            edge="end"
                                        >
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                        />
                        <Button fullWidth variant="contained" sx={{ mt: 2 }} type="submit">
                            Login as {loginType}
                        </Button>
                    </Box>
                </>
            ) : (
                // 2FA Verification Form
                    <Box sx={{ maxWidth: '500px' }}>
                        <Typography variant="h6" sx={{ mb: 2 }}>Two-Factor Authentication Required</Typography>
                        <Grid container spacing={1} justifyContent="center">
                            {twoFACode.map((digit, index) => (
                                <Grid item key={index}>
                                    <TextField inputRef={(el) => (otpInputs.current[index] = el)} value={digit} onChange={(e) => handleChange(index, e.target.value)} variant="outlined" sx={{ width: 50, textAlign: "center" }} inputProps={{ maxLength: 1, style: { textAlign: "center", fontSize: "1.5rem" }, pattern: "[0-9]*", inputMode: "numeric" }} />
                                </Grid>
                            ))}
                        </Grid>
                        <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={handle2FALogin} disabled={isBlocked}>{isBlocked ? `Retry in ${remainingTime}s` : "Verify Code"}</Button>
                        <Button fullWidth variant="outlined" sx={{ mt: 1 }} onClick={() => setRequires2FA(false)}>Back to Login</Button>
                    </Box>
            )}

            {!requires2FA && (
                <Typography variant="body2" sx={{ mt: 2 }}>
                    <Link to="/request-otp" style={{ textDecoration: 'none', color: '#1976d2' }}>
                        Forgot Password?
                    </Link>
                </Typography>
            )}

            <ToastContainer />
        </Box>
    );
}

export default Login;