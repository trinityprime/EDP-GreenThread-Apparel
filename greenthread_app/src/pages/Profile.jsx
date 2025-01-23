import React, { useContext, useState } from 'react';
import { Box, Typography, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from '../http';
import UserContext from '../contexts/UserContext';

function Profile() {
    const { user, setUser } = useContext(UserContext);
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    const handleUpdateClick = () => {
        navigate('/update-user');
    };

    const handleDeactivateClick = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleConfirmDeactivate = () => {
        axios.put(`/user/deactivate/${user.userID}`)
            .then(() => {
                setUser(null);
                localStorage.clear();
                navigate('/login');
            })
            .catch(error => {
                console.error('Error deactivating user:', error);
            });
    };

    return (
        <Box sx={{ mt: 4, mx: 'auto', maxWidth: '500px' }}>
            <Typography variant="h5" sx={{ mb: 2 }}>
                Profile
            </Typography>
            <Typography variant="body1"><strong>First Name:</strong> {user.firstName}</Typography>
            <Typography variant="body1"><strong>Last Name:</strong> {user.lastName}</Typography>
            <Typography variant="body1"><strong>Email:</strong> {user.email}</Typography>
            <Typography variant="body1"><strong>Postal Code:</strong> {user.postalCode}</Typography>
            <Button variant="contained" color="primary" sx={{ mt: 2 }} onClick={handleUpdateClick}>
                Update
            </Button>
            <Button variant="contained" color="secondary" sx={{ mt: 2, ml: 2 }} onClick={handleDeactivateClick}>
                Deactivate Account
            </Button>

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
