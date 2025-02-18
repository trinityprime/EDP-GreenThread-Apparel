import React, { useState, useContext } from "react";
import UserContext from "../contexts/UserContext";
import http from "../http";

const CustomerServiceForm = () => {
    const { user } = useContext(UserContext);
    const [comment, setComment] = useState("");
    const [needReply, setNeedReply] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!user) {
            alert("Please log in first.");
            return;
        }

        const requestData = {
            comment: comment,
            status: "Pending",
            needReply: needReply,
            adminNote: "",
            userID: user.userID,
        };

        try {
            const response = await http.post("/api/customerservice", requestData);

            if (response.ok) {
                alert("Customer service request submitted!");
            } else {
                alert("Error submitting request.");
            }
        } catch (error) {
            console.error("Error:", error);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Describe your issue..."
            />
            <label>
                Need Reply?
                <input
                    type="checkbox"
                    checked={needReply}
                    onChange={() => setNeedReply(!needReply)}
                />
            </label>
            <button type="submit">Submit Request</button>
        </form>
    );
};

export default CustomerServiceForm;
