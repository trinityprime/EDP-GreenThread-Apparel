import React, { useEffect, useState, useContext } from "react";
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    CircularProgress
} from "@mui/material";
import http from "../http";
import UserContext from "../contexts/UserContext";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";

function Refund() {
    const { user } = useContext(UserContext);
    const [refunds, setRefunds] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            toast.error("Please log in to view refunds.");
            navigate("/login");
        } else {
            fetchRefunds();
        }
    }, [user, navigate]);

    const fetchRefunds = async () => {
        try {
            const response = await http.get(`/api/Refund/user-refunds/${user.userID}`);
            setRefunds(response.data);
        } catch (error) {
            toast.error("Failed to load refunds.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ mt: 4, maxWidth: "900px", mx: "auto", p: 2 }}>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: "bold" }}>My Refund Requests</Typography>
            {loading ? (
                <CircularProgress />
            ) : refunds.length === 0 ? (
                <Typography sx={{ textAlign: "center", mt: 4 }}>No refunds found.</Typography>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>Refund ID</strong></TableCell>
                                <TableCell><strong>Order ID</strong></TableCell>
                                <TableCell><strong>Amount</strong></TableCell>
                                <TableCell><strong>Status</strong></TableCell>
                                <TableCell><strong>Requested Date</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {refunds.map((refund) => (
                                <TableRow key={refund.refundID}>
                                    <TableCell>{refund.refundID}</TableCell>
                                    <TableCell>{refund.orderID}</TableCell>
                                    <TableCell>${refund.refundAmount.toFixed(2)}</TableCell>
                                    <TableCell>{refund.refundStatus}</TableCell>
                                    <TableCell>{new Date(refund.refundDate).toLocaleDateString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
            <ToastContainer />
        </Box>
    );
}

export default Refund;
