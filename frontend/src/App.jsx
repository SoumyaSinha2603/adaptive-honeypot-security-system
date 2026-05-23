import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage      from './pages/LoginPage'
import OTPPage        from './pages/OTPPage'
import BankDashboard  from './pages/BankDashboard'
import HoneypotPortal from './pages/HoneypotPortal'
import SecurityDashboard from './pages/SecurityDashboard'

export default function App() {
  return (
    <Routes>
      <Route path="/"          element={<Navigate to="/login" replace />} />
      <Route path="/login"     element={<LoginPage />} />
      <Route path="/otp"       element={<OTPPage />} />
      <Route path="/bank/*"    element={<BankDashboard />} />
      <Route path="/honeypot/*"element={<HoneypotPortal />} />
      <Route path="/dashboard" element={<SecurityDashboard />} />
    </Routes>
  )
}
