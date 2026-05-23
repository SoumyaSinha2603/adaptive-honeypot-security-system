import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import axios from 'axios'

export default function OTPPage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [timer, setTimer] = useState(300) // 5 minutes
  const [resent, setResent] = useState(false)
  const refs = useRef([])

  const { sessionId, destination, maskedPhone, username, verdict, confidence } = state || {}

  useEffect(() => {
    if (!state) { navigate('/login'); return }
    const interval = setInterval(() => setTimer(t => Math.max(0, t - 1)), 1000)
    return () => clearInterval(interval)
  }, [])

  const handleInput = (i, val) => {
    if (!/^\d*$/.test(val)) return
    const next = [...otp]
    next[i] = val.slice(-1)
    setOtp(next)
    if (val && i < 5) refs.current[i+1]?.focus()
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) refs.current[i-1]?.focus()
  }

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (paste.length === 6) {
      setOtp(paste.split(''))
      refs.current[5]?.focus()
    }
    e.preventDefault()
  }

  const verify = async () => {
    const code = otp.join('')
    if (code.length !== 6) { setError('Please enter all 6 digits'); return }
    setLoading(true); setError('')

    try {
      const { data } = await axios.post(
        `/api/verify-otp-full?session_id=${sessionId}&username=${username}&otp_code=${code}&destination=${destination}`
      )
      if (data.status === 'success') {
        if (data.destination === 'bank') {
          navigate('/bank', { state: { user: data.user, sessionId } })
        } else {
          navigate(`/honeypot/dashboard?session=${sessionId}`)
        }
      } else {
        setError(data.message || 'Invalid OTP')
        setOtp(['', '', '', '', '', ''])
        refs.current[0]?.focus()
      }
    } catch {
      setError('Verification failed. Please try again.')
    }
    setLoading(false)
  }

  const resend = async () => {
    setResent(true)
    setTimer(300)
    // In production: call resend API
    setTimeout(() => setResent(false), 3000)
  }

  const mins = String(Math.floor(timer / 60)).padStart(2, '0')
  const secs = String(timer % 60).padStart(2, '0')

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-hdfc-blue shadow-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="flex flex-col leading-none">
            <span className="text-hdfc-red font-extrabold text-2xl tracking-tight">HDFC</span>
            <span className="text-white font-bold text-sm tracking-widest">BANK</span>
          </div>
          <div className="h-8 w-px bg-blue-300 mx-2" />
          <span className="text-white font-semibold">Two-Factor Authentication</span>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-12">
        <div className="card overflow-hidden">
          {/* Progress indicator */}
          <div className="flex">
            {['Credentials', 'CAPTCHA', 'OTP'].map((step, i) => (
              <div key={step} className={`flex-1 py-2 text-center text-xs font-semibold ${
                i < 2 ? 'bg-green-500 text-white' :
                i === 2 ? 'bg-hdfc-blue text-white' :
                'bg-gray-100 text-gray-400'
              }`}>
                {i < 2 ? '✓ ' : ''}{step}
              </div>
            ))}
          </div>

          <div className="px-8 py-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📱</span>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">OTP Verification</h2>
              <p className="text-sm text-gray-500">
                A 6-digit OTP has been sent to
              </p>
              <p className="text-sm font-bold text-gray-700 mt-1">{maskedPhone}</p>
              {destination === 'honeypot' && (
                <p className="text-xs text-gray-400 mt-2">(Demo: check your terminal for the OTP)</p>
              )}
              {destination === 'bank' && (
                <p className="text-xs text-green-600 mt-2">✅ Check your terminal window for the OTP</p>
              )}
            </div>

            {/* OTP input boxes */}
            <div className="flex gap-3 justify-center mb-6" onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={el => refs.current[i] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={e => handleInput(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg focus:outline-none transition-colors ${
                    digit
                      ? 'border-hdfc-blue bg-blue-50 text-hdfc-blue'
                      : 'border-gray-300 focus:border-hdfc-blue'
                  }`}
                />
              ))}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4 text-center">
                {error}
              </div>
            )}

            {/* Timer */}
            <div className="text-center mb-6">
              {timer > 0 ? (
                <span className="text-sm text-gray-500">
                  OTP expires in <span className="font-bold text-hdfc-blue">{mins}:{secs}</span>
                </span>
              ) : (
                <span className="text-sm text-red-500 font-medium">OTP expired</span>
              )}
            </div>

            <button
              onClick={verify}
              disabled={loading || otp.join('').length !== 6}
              className="w-full hdfc-btn-primary py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify & Login'}
            </button>

            <div className="text-center mt-4">
              {!resent ? (
                <button
                  onClick={resend}
                  className="text-sm text-hdfc-blue hover:underline"
                >
                  Didn't receive OTP? Resend
                </button>
              ) : (
                <span className="text-sm text-green-600">OTP resent successfully</span>
              )}
            </div>
          </div>
        </div>

        {/* Security notice */}
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex gap-2">
            <span className="text-yellow-600">⚠️</span>
            <div>
              <p className="text-xs font-semibold text-yellow-800">Security Notice</p>
              <p className="text-xs text-yellow-700 mt-0.5">
                HDFC Bank will never ask you for your OTP over phone or email.
                Do not share this OTP with anyone.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-3 text-center">
          <button onClick={() => navigate('/login')} className="text-sm text-gray-500 hover:text-hdfc-blue">
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  )
}
