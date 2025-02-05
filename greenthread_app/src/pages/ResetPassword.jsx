import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function ResetPassword() {
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [message, setMessage] = useState("");
    const location = useLocation();
    const navigate = useNavigate();
    const email = location.state?.email;

    const handleResetPassword = async () => {
        if (password !== confirmPassword) {
            setMessage("Passwords do not match");
            return;
        }

        const response = await fetch("http://localhost:5082/user/reset-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        if (response.ok) {
            navigate("/login");
        } else {
            setMessage(data.message);
        }
    };

    return (
        <div className="flex flex-col items-center p-6">
            <h1 className="text-2xl font-bold">Reset Password</h1>
            <input
                type="password"
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-4 p-2 border rounded"
            />
            <input
                type="password"
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-2 p-2 border rounded"
            />
            <button onClick={handleResetPassword} className="mt-4 p-2 bg-blue-500 text-white rounded">
                Reset Password
            </button>
            {message && <p className="text-red-500 mt-2">{message}</p>}
        </div>
    );
}
