import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import useTelemetry from '../hooks/useTelemetry'
import Captcha from '../components/Captcha'

const BOT_FEATURES = {
  typing_speed:1200, backspace_count:0, mouse_movement_speed:0,
  cursor_path_length:0, keystroke_interval:1, mouse_click_frequency:95,
  session_duration:0.3, login_time:3.0, unusual_login_time:true,
  vpn_detected:true, failed_login_attempts:8, browser_fingerprint_risk:0.95,
  ip_address_risk:0.90, geo_location_change:true, device_change:true,
  keystroke_variance:0.5, scroll_depth:0, copy_paste_detected:true,
  reading_time:0.1, hesitation_count:0, mouse_path_curvature:0.02,
  device_fingerprint:'HeadlessChrome/Puppeteer',
}

const HUMAN_FEATURES = {
  typing_speed:58, backspace_count:3, mouse_movement_speed:210,
  cursor_path_length:1850, keystroke_interval:162, mouse_click_frequency:1.9,
  session_duration:45, login_time:14.5, unusual_login_time:false,
  vpn_detected:false, failed_login_attempts:0, browser_fingerprint_risk:0.02,
  ip_address_risk:0.03, geo_location_change:false, device_change:false,
  keystroke_variance:38, scroll_depth:0.6, copy_paste_detected:false,
  reading_time:4.2, hesitation_count:2, mouse_path_curvature:0.72,
  device_fingerprint:'Mozilla/5.0 Chrome',
}

export default function LoginPage() {
  console.log("LOGIN PAGE RENDERED")
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [captchaToken, setCaptchaToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mlResult, setMlResult] = useState(null)
  const [demoMode, setDemoMode] = useState(null)
  const navigate = useNavigate()
  const { getFeatures } = useTelemetry()

  const submit = async (overrideFeatures = null) => {
    if (!username || !password) { setError('Please enter Customer ID and IPIN'); return }
    if (!captchaToken) { setError('Please complete the CAPTCHA verification'); return }
    setLoading(true); setError(''); setMlResult(null)

    const features = overrideFeatures || getFeatures()
    try {
      const { data } = await axios.post('/api/login', {
        username, password, captcha_token: captchaToken, ...features,
      })
      if (data.status === 'error') {
        setError(data.message || 'Login failed'); setLoading(false); return
      }
      setMlResult(data)
      setTimeout(() => {
        navigate('/otp', { state: {
          sessionId:   data.session_id,
          destination: data.destination,
          maskedPhone: data.masked_phone,
          username,
          verdict:     data.verdict,
          confidence:  data.confidence,
        }})
      }, 1800)
    } catch {
      setError('Connection error. Please try again.'); setLoading(false)
    }
  }

  const handleForm = (e) => {
  e.preventDefault();

  if (demoMode === 'bot') {
    submit(BOT_FEATURES);
  } else if (demoMode === 'human') {
    submit(HUMAN_FEATURES);
  } else {
    submit(null);
  }
}

  const simulateBot = () => {
    setUsername('rajesh.kumar'); setPassword('Rajesh@2024')
    setDemoMode('bot')
    setTimeout('')
    
  }

  const simulateHuman = () => {
    setUsername('rajesh.kumar'); setPassword('Rajesh@2024')
    setDemoMode('human')
    setTimeout('')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Top strip */}
      <div className="bg-hdfc-navy text-xs text-gray-300 px-6 py-1.5 flex justify-between items-center">
        <span>Customer Care: 1800-202-6161 / 1800-267-6161 (Toll Free)</span>
        <div className="flex gap-4">
          <span className="cursor-pointer hover:text-white">Personal</span>
          <span className="cursor-pointer hover:text-white">Business</span>
          <span className="cursor-pointer hover:text-white">Preferred</span>
          <span className="cursor-pointer hover:text-white">NRI</span>
        </div>
      </div>

      {/* Main navbar */}
      <div className="bg-white shadow-md">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          {/* HDFC Logo */}
          <div className="flex items-center gap-2">
            <div className="flex flex-col leading-none">
              <span className="text-hdfc-red font-extrabold text-2xl tracking-tight">HDFC</span>
              <span className="text-hdfc-blue font-bold text-sm tracking-widest">BANK</span>
            </div>
          </div>
          <nav className="hidden md:flex gap-1">
            {['Accounts','Cards','Loans','Investments','Insurance','Pay'].map(n => (
              <span key={n} className="nav-link">{n}</span>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <button className="text-sm text-hdfc-blue font-medium hover:underline">Find ATM/Branch</button>
            <a href="/dashboard" className="text-xs text-gray-500 hover:text-hdfc-blue border border-gray-300 px-3 py-1.5 rounded">
              Security Dashboard
            </a>
          </div>
        </div>
      </div>

      {/* Page body */}
      <div className="max-w-6xl mx-auto px-4 py-10 flex gap-8 items-start">

        {/* Left: Login card */}
        <div className="w-full max-w-sm">
          <div className="card overflow-hidden">
            {/* Card header */}
            <div className="bg-hdfc-blue px-6 py-4">
              <h1 className="text-white font-bold text-lg">NetBanking Login</h1>
              <p className="text-blue-200 text-xs mt-0.5">Secure · Trusted · 24×7</p>
            </div>

            <form onSubmit={handleForm} className="px-6 py-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  Customer ID / User ID
                </label>
                <input
                  type="text" value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter Customer ID"
                  className="hdfc-input"
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">
                  IPIN (Password)
                </label>
                <input
                  type="password" value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter IPIN"
                  className="hdfc-input"
                  autoComplete="current-password"
                />
                <div className="flex justify-end mt-1">
                  <span className="text-xs text-hdfc-red cursor-pointer hover:underline">Forgot IPIN?</span>
                </div>
              </div>

              {/* CAPTCHA */}
              <div>
                <Captcha
                  onVerified={token => { setCaptchaToken(token); setError('') }}
                  onReset={() => setCaptchaToken('')}
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded">
                  {error}
                </div>
              )}

              {/* ML result banner */}
              {mlResult && (
                <div className={`text-sm px-4 py-3 rounded-lg border ${
                  mlResult.verdict === 'ATTACKER'
                    ? 'bg-red-50 border-red-300 text-red-800'
                    : 'bg-green-50 border-green-300 text-green-800'
                }`}>
                  <div className="font-bold">
                    {mlResult.verdict === 'ATTACKER' ? '🚨 Security alert detected' : '✅ Identity verified'}
                  </div>
                  <div className="text-xs mt-1 opacity-75">
                    Confidence: {(mlResult.confidence * 100).toFixed(1)}% ·
                    Trigger: {mlResult.trigger} ·
                    {mlResult.verdict === 'ATTACKER' ? ' Routing to secure environment...' : ' Sending OTP...'}
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !captchaToken}
                className="w-full hdfc-btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Login'}
              </button>

              <div className="text-center text-xs text-gray-400">
                🔒 256-bit SSL Encrypted · Your security is our priority
              </div>
            </form>

            {/* Bottom links */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between text-xs text-hdfc-blue">
              <span className="cursor-pointer hover:underline">New User Registration</span>
              <span className="cursor-pointer hover:underline">Unlock Account</span>
            </div>
          </div>

          {/* Security badges */}
          <div className="mt-4 flex items-center justify-center gap-4">
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="text-green-500 text-base">🛡</span> CERT-In Compliant
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="text-blue-500 text-base">🔐</span> RBI Regulated
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="text-yellow-500 text-base">⭐</span> ISO 27001
            </div>
          </div>
        </div>

        {/* Right: Info panels */}
        <div className="flex-1 space-y-4">
          {/* Quick links */}
          <div className="card p-5">
            <h3 className="text-hdfc-blue font-bold text-sm mb-4 uppercase tracking-wide">Quick Services</h3>
            <div className="grid grid-cols-4 gap-3">
              {[
                { icon: '💳', label: 'Credit Card Pay' },
                { icon: '🏠', label: 'Home Loan EMI' },
                { icon: '📱', label: 'Mobile Banking' },
                { icon: '💰', label: 'FD Rates' },
                { icon: '📊', label: 'Mutual Funds' },
                { icon: '🚗', label: 'Car Loan' },
                { icon: '✈️', label: 'Forex Card' },
                { icon: '🏥', label: 'Insurance' },
              ].map(({ icon, label }) => (
                <div key={label} className="text-center cursor-pointer hover:bg-blue-50 rounded-lg p-3 transition-colors">
                  <div className="text-2xl mb-1">{icon}</div>
                  <div className="text-xs text-gray-600 font-medium">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Offer banner */}
          <div className="bg-gradient-to-r from-hdfc-blue to-hdfc-ltblue rounded-lg p-5 text-white">
            <div className="text-xs font-semibold text-blue-200 uppercase tracking-wide mb-1">Featured Offer</div>
            <div className="text-lg font-bold mb-1">Get up to ₹1,000 cashback</div>
            <div className="text-sm text-blue-100 mb-3">On your first UPI transaction via HDFC Bank NetBanking</div>
            <button className="bg-white text-hdfc-blue text-xs font-bold px-4 py-2 rounded hover:bg-blue-50 transition-colors">
              Know More →
            </button>
          </div>

          {/* Demo controls panel */}
          <div className="bg-gray-900 rounded-lg p-5 text-sm">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
              <span className="text-yellow-400 font-bold text-xs uppercase tracking-wider">Demo / Research Mode</span>
            </div>
            <p className="text-gray-400 text-xs mb-4">
              These buttons inject hardcoded feature vectors directly — bypassing real telemetry for reliable demo results.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <button
                onClick={simulateBot}
                disabled={loading}
                className="bg-red-900/50 hover:bg-red-900 border border-red-700 text-red-300 px-3 py-3 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
              >
                🤖 Simulate Bot Attack
                <div className="text-red-500/70 font-normal mt-0.5">typing=1200 · mouse=0 · vpn=true</div>
              </button>
              <button
                onClick={simulateHuman}
                disabled={loading}
                className="bg-green-900/50 hover:bg-green-900 border border-green-700 text-green-300 px-3 py-3 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
              >
                👤 Simulate Legitimate User
                <div className="text-green-500/70 font-normal mt-0.5">rajesh.kumar · normal behavior</div>
              </button>
            </div>

            {/* Feature comparison table */}
            {demoMode && (
              <div className="bg-gray-800 rounded-lg p-3 text-xs">
                <div className="text-gray-400 font-medium mb-2">
                  Features being sent ({demoMode === 'bot' ? '🤖 Bot' : '👤 Human'}):
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-1 max-h-40 overflow-y-auto">
                  {Object.entries(demoMode === 'bot' ? BOT_FEATURES : HUMAN_FEATURES)
                    .filter(([k]) => k !== 'device_fingerprint')
                    .map(([k, v]) => (
                    <div key={k} className="flex justify-between">
                      <span className="text-gray-500">{k.replace(/_/g, ' ')}</span>
                      <span className={typeof v === 'boolean'
                        ? (v ? 'text-red-400' : 'text-green-400')
                        : 'text-gray-300'}>
                        {String(v)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-3 pt-3 border-t border-gray-800 text-xs text-gray-600">
              Real users: rajesh.kumar | priya.sharma | amit.verma | sneha.reddy | vikram.singh
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
