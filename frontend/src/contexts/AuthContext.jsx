import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetch(`${BACKEND_URL}/user/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
                .then((res) => {
                    if (res.ok) return res.json();
                    throw new Error('Failed to fetch user data');
                })
                .then((data) => {
                    if (data.user) {
                        setUser(data.user);
                    }
                })
                .catch((err) => {
                    console.error(err);
                    localStorage.removeItem('token');
                    setUser(null);
                });
        } else {
            setUser(null);
        }
    }, [BACKEND_URL]);

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
        navigate("/");
    };

    const login = async (username, password) => {
        try {
            const res = await fetch(`${BACKEND_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });
            if (!res.ok) {
                const errorData = await res.json();
                return errorData.message || "Login failed";
            }
            const data = await res.json();
            const token = data.token;
            localStorage.setItem('token', token);
            // Fetch user data with the token.
            const userRes = await fetch(`${BACKEND_URL}/user/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!userRes.ok) {
                const errorData = await userRes.json();
                return errorData.message || "Failed to fetch user data";
            }
            const userData = await userRes.json();
            setUser(userData.user);
            navigate("/profile");
        } catch (error) {
            console.error(error);
            return "Login failed due to network error";
        }
    };

    const register = async ({ username, firstname, lastname, password }) => {
        try {
            const res = await fetch(`${BACKEND_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, firstname, lastname, password })
            });
            if (res.status === 201) {
                navigate("/success");
            } else {
                const errorData = await res.json();
                return errorData.message || "Registration failed";
            }
        } catch (error) {
            console.error(error);
            return "Registration failed due to network error";
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, register }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};

