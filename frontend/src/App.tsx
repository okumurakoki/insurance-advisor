import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CustomerList from './pages/CustomerList';
import CustomerDetail from './pages/CustomerDetail';
import CustomerForm from './pages/CustomerForm';
import AnalysisNew from './pages/AnalysisNew';
import AnalysisResult from './pages/AnalysisResult';
import MarketData from './pages/MarketData';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Unauthorized from './pages/Unauthorized';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
      '"Apple Color Emoji"',
      '"Segoe UI Emoji"',
      '"Segoe UI Symbol"',
    ].join(','),
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Layout>
                    <Navigate to="/dashboard" replace />
                  </Layout>
                </PrivateRoute>
              }
            />
            
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </PrivateRoute>
              }
            />
            
            <Route
              path="/customers"
              element={
                <PrivateRoute>
                  <Layout>
                    <CustomerList />
                  </Layout>
                </PrivateRoute>
              }
            />
            
            <Route
              path="/customers/new"
              element={
                <PrivateRoute>
                  <Layout>
                    <CustomerForm />
                  </Layout>
                </PrivateRoute>
              }
            />
            
            <Route
              path="/customers/:id"
              element={
                <PrivateRoute>
                  <Layout>
                    <CustomerDetail />
                  </Layout>
                </PrivateRoute>
              }
            />
            
            <Route
              path="/customers/:id/edit"
              element={
                <PrivateRoute>
                  <Layout>
                    <CustomerForm />
                  </Layout>
                </PrivateRoute>
              }
            />
            
            <Route
              path="/analysis/new/:customerId"
              element={
                <PrivateRoute>
                  <Layout>
                    <AnalysisNew />
                  </Layout>
                </PrivateRoute>
              }
            />
            
            <Route
              path="/analysis/:id"
              element={
                <PrivateRoute>
                  <Layout>
                    <AnalysisResult />
                  </Layout>
                </PrivateRoute>
              }
            />
            
            <Route
              path="/market-data"
              element={
                <PrivateRoute allowedAccountTypes={['parent']}>
                  <Layout>
                    <MarketData />
                  </Layout>
                </PrivateRoute>
              }
            />
            
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Layout>
                    <Profile />
                  </Layout>
                </PrivateRoute>
              }
            />
            
            <Route
              path="/settings"
              element={
                <PrivateRoute>
                  <Layout>
                    <Settings />
                  </Layout>
                </PrivateRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;