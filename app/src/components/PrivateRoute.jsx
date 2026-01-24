import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

const PrivateRoute = ({ children, authorized, setAuthorized,setUser,loading, setLoading}) => {

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await fetch("https://expense-tracker-pachamuthu-k5r3.vercel.app/api/auth/me", {
                    credentials: "include"
                });

                const result = await res.json()

                if (res.ok) {
                    setAuthorized(true);
                    setUser(result.data)
                } else {
                    setAuthorized(false);
                }
            } catch {
                setAuthorized(false);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    if (loading) return null; // or loader

    return authorized ? children : <Navigate to="/login" />;
};

export default PrivateRoute;
