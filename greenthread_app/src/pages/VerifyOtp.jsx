import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function VerifyOtp() {
    const [otp, setOtp] = useState("");
    const [message, setMessage] = useState("");
    const location = useLocation();
    const navigate = useNavigate();
    const email = location.state?.email;

    const handleVerifyOtp = async () => {
        const response = await fetch(`http://localhost:5082/api/otp/verify?otpCode=${otp}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        });
        const data = await response.json();
        if (response.ok) {
            navigate("/reset-password", { state: { email } });
        } else {
            setMessage(data.message);
        }
    };

    return (
        <div className="flex flex-col items-center p-6">
            <h1 className="text-2xl font-bold">Verify OTP</h1>
            <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="mt-4 p-2 border rounded"
            />
            <button onClick={handleVerifyOtp} className="mt-4 p-2 bg-blue-500 text-white rounded">
                Verify OTP
            </button>
            {message && <p className="text-red-500 mt-2">{message}</p>}
        </div>
    );
}
