import React from 'react';
import { Box, Typography } from '@mui/material';

function NotAuthorized() {
    return (
        <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Typography variant="h4">Not Authorized</Typography>
            <Typography variant="body1">
                You do not have permission to access this page.
            </Typography>
        </Box>
    );
}

export default NotAuthorized;