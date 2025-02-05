import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RequestOtp() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    const handleRequestOtp = async () => {
        const response = await fetch("http://localhost:5082/api/otp/request", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        });
        const data = await response.json();
        if (response.ok) {
            navigate("/verify-otp", { state: { email } });
        } else {
            setMessage(data.message);
        }
    };

    return (
        <div className="flex flex-col items-center p-6">
            <h1 className="text-2xl font-bold">Request OTP</h1>
            <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-4 p-2 border rounded"
            />
            <button onClick={handleRequestOtp} className="mt-4 p-2 bg-blue-500 text-white rounded">
                Request OTP
            </button>
            {message && <p className="text-red-500 mt-2">{message}</p>}
        </div>
    );
}
