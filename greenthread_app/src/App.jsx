import "./App.css";
import { useState, useEffect } from "react";
import {Container, AppBar, Toolbar, Typography, Box, Button } from "@mui/material";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import MyTheme from "./themes/MyTheme";
import Tutorials from "./pages/Tutorials";
import Register from "./pages/Register";
import Login from "./pages/Login";
import http from "./http";
import UserContext from "./contexts/UserContext";
import Profile from "./pages/Profile";
import AdminDashboard from "./pages/AdminDashboard";
import UpdateUser from "./pages/UpdateUser";
import UpdateForm from "./pages/components/UpdateForm";
import CreateAdminForm from "./pages/components/CreateAdminForm";
import CreateUserForm from "./pages/components/CreateUserForm";
import NotAuthorized from "./pages/components/NotAuthorized";

function App() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        if (localStorage.getItem("accessToken")) {
            http.get("/user/auth").then((res) => {
                setUser(res.data.user);
            });
        }
    }, []);

    const logout = () => {
        localStorage.clear();
        window.location = "/";
    };

    return (
        <UserContext.Provider value={{ user, setUser }}>
            <Router>
                <ThemeProvider theme={MyTheme}>
                    <AppBar position="static" className="AppBar">
                        <Container>
                            <Toolbar disableGutters={true}>
                                <Link to="/">
                                    <Typography variant="h6" component="div">
                                        GreenThread
                                    </Typography>
                                </Link>
                                <Box sx={{ flexGrow: 1 }}></Box>
                                {user && (
                                    <>
                                        <Typography>{user.name}</Typography>
                                        <Button onClick={logout}>Logout</Button>
                                    </>
                                )}
                                {!user && (
                                    <>
                                        <Link to="/register">
                                            <Typography>Register</Typography>
                                        </Link>
                                        <Link to="/login">
                                            <Typography>Login</Typography>
                                        </Link>
                                    </>
                                )}
                            </Toolbar>
                        </Container>
                    </AppBar>

                    <Container>
                        <Routes>
                            <Route path={"/"} element={<Tutorials />} />
                            <Route path={"/tutorials"} element={<Tutorials />} />
                            <Route path={"/register"} element={<Register />} />
                            <Route path={"/login"} element={<Login />} />
                            <Route path={"/admin-dashboard"} element={<AdminDashboard />} />
                            <Route path={"/profile"} element={<Profile />} />
                            <Route path={"/update-user"} element={<UpdateUser />} /> 
                            <Route path="/update-user/:id" element={<UpdateForm type="user" />} />
                            <Route path="/update-admin/:id" element={<UpdateForm type="admin" />} />
                            <Route path="/create-admin" element={<CreateAdminForm />} />
                            <Route path="/create-user" element={<CreateUserForm />} />
                            <Route path="/not-authorized" element={<NotAuthorized />} />

                        </Routes>
                    </Container>
                </ThemeProvider>
            </Router>
        </UserContext.Provider>
    );
}

export default App;
