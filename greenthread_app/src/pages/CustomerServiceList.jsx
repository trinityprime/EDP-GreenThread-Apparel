import React, { useState, useEffect, useContext } from "react";
import { useNavigate } from "react-router-dom";
import http from "../http";
import UserContext from "../contexts/UserContext";

const CustomerServiceList = () => {
    const { user } = useContext(UserContext);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (!user?.userID) {
            setError("Please log in to view your customer service requests.");
            setLoading(false);
            return;
        }

        const fetchRequests = async () => {
            try {
                console.log("Fetching requests for userID:", user.userID);
                const response = await http.get(`/api/customerservice/user/${user.userID}`);
                setRequests(response.data);
            } catch (err) {
                setError(err.response?.data || "Error fetching customer service requests");
            } finally {
                setLoading(false);
            }
        };

        fetchRequests();
    }, [user?.userID]); // Only re-run if userID changes


    const handleNewRequest = () => {
        navigate("/create-customer-service");
    };

    if (error) return <p style={{ color: "red" }}>{error}</p>;

    if (requests.length === 0) {
        return (
            <div>
                <h2>Your Customer Service Requests</h2>
                <p>No customer service requests found.</p>
                <button
                    onClick={handleNewRequest}
                    style={{ marginTop: "20px", padding: "10px", fontSize: "16px", cursor: "pointer" }}
                >
                    Submit a New Customer Service Request
                </button>
            </div>
        );
    }

    if (loading) return <p>Loading requests...</p>;

    return (
        <div>
            <h2>Your Customer Service Requests</h2>
            <button
                onClick={handleNewRequest}
                style={{ marginTop: "20px", padding: "10px", fontSize: "16px", cursor: "pointer" }}
            >
                Submit a New Customer Service Request
            </button>
            {requests.length === 0 ? (
                <>
                    <p>No customer service requests found :DD</p>
                    <button
                        onClick={handleNewRequest}
                        style={{ marginTop: "20px", padding: "10px", fontSize: "16px", cursor: "pointer" }}
                    >
                        Submit a New Customer Service Request
                    </button>
                </>
            ) : (

                <ul>
                    {requests.map(request => (
                        <li key={request.customerServiceID}>
                            <p><strong>Comment:</strong> {request.comment}</p>
                            <p><strong>Status:</strong> {request.status}</p>
                            <p><strong>Need Reply:</strong> {request.needReply ? "Yes" : "No"}</p>
                            <p><strong>Admin Note:</strong> {request.adminNote || "No notes yet"}</p>
                            <p><strong>Created At:</strong> {new Date(request.createdAt).toLocaleString()}</p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default CustomerServiceList;
