import React, { useState, useEffect, useRef } from 'react'

// Simple visual challenges - math questions shown as challenge fallback
const CHALLENGES = [
  { q: 'What is 7 + 5?',   a: '12' },
  { q: 'What is 15 - 8?',  a: '7'  },
  { q: 'What is 3 × 4?',   a: '12' },
  { q: 'What is 24 ÷ 6?',  a: '4'  },
  { q: 'What is 9 + 13?',  a: '22' },
  { q: 'What is 18 - 9?',  a: '9'  },
  { q: 'What is 6 × 7?',   a: '42' },
  { q: 'What is 36 ÷ 4?',  a: '9'  },
]

export default function Captcha({ onVerified, onReset }) {
  const [state, setState] = useState('idle')     // idle | animating | challenge | verified | failed
  const [challenge, setChallenge] = useState(null)
  const [answer, setAnswer] = useState('')
  const [error, setError] = useState('')
  const [checkAnim, setCheckAnim] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const handleCheckbox = () => {
    if (state !== 'idle') return
    setState('animating')
    setCheckAnim(true)

    // Simulate behavior analysis delay (like real reCAPTCHA)
    timerRef.current = setTimeout(() => {
      // 70% chance pass directly (simulates low-risk user)
      // 30% chance show challenge (simulates medium-risk)
      if (Math.random() > 0.3) {
        setState('verified')
        onVerified('verified')
      } else {
        const c = CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)]
        setChallenge(c)
        setState('challenge')
      }
    }, 1200)
  }

  const handleChallengeSubmit = (e) => {
    e.preventDefault()
    if (answer.trim() === challenge.a) {
      setState('verified')
      setError('')
      onVerified('verified')
    } else {
      setError('Incorrect. Please try again.')
      setAnswer('')
      // New challenge
      const c = CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)]
      setChallenge(c)
    }
  }

  const handleRefresh = () => {
    setState('idle')
    setCheckAnim(false)
    setChallenge(null)
    setAnswer('')
    setError('')
    onReset()
  }

  return (
    <div className="w-full">
      {/* Main CAPTCHA box */}
      <div className={`border-2 rounded-md bg-gray-50 p-4 transition-colors ${
        state === 'verified' ? 'border-green-400 bg-green-50' :
        state === 'failed'   ? 'border-red-400 bg-red-50' :
        'border-gray-300'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Checkbox */}
            <button
              type="button"
              onClick={handleCheckbox}
              disabled={state !== 'idle'}
              className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${
                state === 'idle'       ? 'border-gray-400 bg-white hover:border-hdfc-blue cursor-pointer' :
                state === 'animating' ? 'border-hdfc-blue bg-white cursor-wait' :
                state === 'verified'  ? 'border-green-500 bg-green-500 cursor-default' :
                state === 'challenge' ? 'border-hdfc-blue bg-hdfc-blue cursor-default' :
                'border-gray-400 bg-white cursor-pointer'
              }`}
            >
              {state === 'animating' && (
                <div className="w-3 h-3 border-2 border-hdfc-blue border-t-transparent rounded-full animate-spin" />
              )}
              {state === 'verified' && (
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
              {state === 'challenge' && (
                <div className="w-2 h-2 bg-white rounded-full" />
              )}
            </button>
            <span className={`text-sm font-medium ${
              state === 'verified' ? 'text-green-700' : 'text-gray-700'
            }`}>
              {state === 'verified' ? 'Verified' : 'I\'m not a robot'}
            </span>
          </div>

          {/* reCAPTCHA branding */}
          <div className="flex flex-col items-center">
            <div className="flex gap-0.5">
              {['#4285F4','#EA4335','#FBBC05','#34A853'].map((c, i) => (
                <div key={i} className="w-1.5 h-4 rounded-sm" style={{ background: c }} />
              ))}
            </div>
            <span className="text-[9px] text-gray-400 mt-0.5">reCAPTCHA</span>
            <span className="text-[8px] text-gray-300">Privacy - Terms</span>
          </div>
        </div>
      </div>

      {/* Challenge popup */}
      {state === 'challenge' && challenge && (
        <div className="mt-3 border-2 border-hdfc-blue rounded-lg bg-white shadow-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-800">Security Verification</span>
            <button onClick={handleRefresh} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
          </div>
          <p className="text-xs text-gray-600 mb-3">
            Please solve this to confirm you're human:
          </p>

          {/* Visual challenge box */}
          <div className="bg-gradient-to-br from-hdfc-blue to-hdfc-navy rounded-lg p-6 mb-3 text-center">
            <div className="text-white text-2xl font-bold tracking-widest select-none"
              style={{ fontFamily: 'monospace', textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                       letterSpacing: '0.2em', transform: 'skewX(-5deg)' }}>
              {challenge.q}
            </div>
          </div>

          <form onSubmit={handleChallengeSubmit} className="flex gap-2">
            <input
              autoFocus
              type="text"
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              placeholder="Your answer"
              className="hdfc-input flex-1 text-center font-bold"
            />
            <button type="submit" className="hdfc-btn-primary px-4 py-2">
              Verify
            </button>
          </form>

          {error && <p className="text-red-500 text-xs mt-2">{error}</p>}

          <div className="flex items-center justify-between mt-2">
            <button onClick={handleRefresh} className="text-xs text-hdfc-blue hover:underline">
              ↺ Try different challenge
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
