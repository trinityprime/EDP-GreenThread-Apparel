import React, { useContext } from "react";
import { Box, Typography, Divider, Paper } from "@mui/material";
import UserContext from "../contexts/UserContext";

function Profile() {
    const { user } = useContext(UserContext);

    return (
        <Box
            sx={{
                mt: 4,
                mx: "auto",
                maxWidth: "400px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center"
            }}
        >
            <Paper elevation={3} sx={{ p: 4, width: "100%", borderRadius: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: "bold", mb: 2 }}>
                    Profile
                </Typography>

                <Divider sx={{ mb: 2 }} />

                <Typography variant="body1">
                    <strong>First Name:</strong> {user.firstName}
                </Typography>
                <Typography variant="body1">
                    <strong>Last Name:</strong> {user.lastName}
                </Typography>
                <Typography variant="body1">
                    <strong>Email:</strong> {user.email}
                </Typography>
                <Typography variant="body1">
                    <strong>Postal Code:</strong> {user.postalCode}
                </Typography>
                <Typography variant="body1">
                    <strong>2FA Status:</strong> {user.isTwoFactorEnabled ? "Enabled" : "Disabled"}
                </Typography>
            </Paper>
        </Box>
    );
}

export default Profile;
