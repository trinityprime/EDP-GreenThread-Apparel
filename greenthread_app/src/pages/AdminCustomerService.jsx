import { useState, useEffect } from "react";
import http from "../http";

const AdminCustomerService = () => {
    const [requests, setRequests] = useState([]);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [adminNote, setAdminNote] = useState("");
    const [status, setStatus] = useState("Pending");

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const response = await http.get("/api/customerservice");
                setRequests(response.data);
            } catch (err) {
                console.error("Error fetching requests:", err);
            }
        };

        fetchRequests();
    }, []);

    const handleUpdate = async () => {
        if (!selectedRequest) return;

        const requestData = {
            comment: selectedRequest.comment, // Keep original comment
            status,
            adminNote,
        };

        try {
            const response = await http.patch(
                `/api/customerservice/${selectedRequest.customerServiceID}/admin-update`,
                requestData
            );

            if (response.status === 200) { // Axios uses response.status, not response.ok
                alert("Request updated successfully");
                setRequests((prev) =>
                    prev.map((req) =>
                        req.customerServiceID === selectedRequest.customerServiceID
                            ? { ...req, status, adminNote }
                            : req
                    )
                );
                setSelectedRequest(null);
                setAdminNote("");
                setStatus("Pending");
            } else {
                alert("Failed to update request");
            }
        } catch (err) {
            alert("Failed to update request");
            console.error("Error updating request:", err);
        }
    };

    return (
        <div>
            <h2>Admin - Customer Service Requests</h2>
            <table border="1">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Comment</th>
                        <th>Status</th>
                        <th>Need Reply</th>
                        <th>Admin Note</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {requests.map((req) => (
                        <tr key={req.customerServiceID}>
                            <td>{req.customerServiceID}</td>
                            <td>{req.comment}</td>
                            <td>{req.status}</td>
                            <td>{req.needReply ? "Yes" : "No"}</td>
                            <td>{req.adminNote}</td>
                            <td>
                                <button
                                    onClick={() => {
                                        setSelectedRequest(req);
                                        setAdminNote(req.adminNote || "");
                                        setStatus(req.status);
                                    }}
                                >
                                    Edit
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {selectedRequest && (
                <div>
                    <h3>Update Request (ID: {selectedRequest.customerServiceID})</h3>
                    <p><strong>Comment:</strong> {selectedRequest.comment}</p> {/* Display comment, not editable */}

                    <label>
                        Admin Note:
                        <textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} />
                    </label>
                    <br />
                    <label>
                        Status:
                        <select value={status} onChange={(e) => setStatus(e.target.value)}>
                            <option value="Pending">Pending</option>
                            <option value="Completed">Completed</option>
                        </select>
                    </label>
                    <br />
                    <button onClick={handleUpdate}>Update</button>
                    <button onClick={() => setSelectedRequest(null)}>Cancel</button>
                </div>
            )}
        </div>
    );
};

export default AdminCustomerService;
