import React, { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import axios from 'axios'

// ── HDFC Top Bar ──────────────────────────────────────────────────────────────
function TopBar({ user, onLogout }) {
  return (
    <>
      {/* Strip */}
      <div className="bg-hdfc-navy text-xs text-gray-300 px-6 py-1.5 flex justify-between">
        <span>Customer Care: 1800-202-6161 (Toll Free) | {new Date().toLocaleDateString('en-IN', {weekday:'long', year:'numeric', month:'long', day:'numeric'})}</span>
        <div className="flex gap-4">
          <span>English</span>
          <span className="cursor-pointer hover:text-white" onClick={onLogout}>Logout</span>
        </div>
      </div>
      {/* Main nav */}
      <div className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center h-14">
            {/* Logo */}
            <div className="flex flex-col leading-none mr-8">
              <span className="text-hdfc-red font-extrabold text-xl tracking-tight">HDFC</span>
              <span className="text-hdfc-blue font-bold text-xs tracking-widest">BANK</span>
            </div>
            {/* Nav tabs */}
            {['Banking','Lifestyle','Rewards'].map((t,i) => (
              <button key={t} className={`px-4 h-14 text-sm font-semibold border-b-2 transition-colors ${
                i===0 ? 'border-hdfc-red text-hdfc-red' : 'border-transparent text-gray-600 hover:text-hdfc-blue'
              }`}>{t}</button>
            ))}
            <div className="ml-auto flex items-center gap-4">
              <button className="text-gray-500 hover:text-hdfc-blue text-xl">🔍</button>
              <button className="text-gray-500 hover:text-hdfc-blue text-xl">🔔</button>
              <div className="flex items-center gap-2 bg-hdfc-blue text-white px-3 py-1.5 rounded-full text-sm font-semibold">
                <span className="w-7 h-7 bg-hdfc-red rounded-full flex items-center justify-center text-xs font-bold">
                  {user?.full_name?.[0] || 'U'}
                </span>
                <span>My Profile</span>
              </div>
            </div>
          </div>
        </div>
        {/* Sub-nav */}
        <div className="bg-gray-50 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex gap-0">
              {['Overview','Accounts','Payments','Deposits','Loans','Cards','Investments','Insurance','Services'].map((t,i) => (
                <button key={t} className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
                  i===0 ? 'border-hdfc-blue text-hdfc-blue' : 'border-transparent text-gray-600 hover:text-hdfc-blue hover:border-gray-300'
                }`}>{t}</button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Account Card ──────────────────────────────────────────────────────────────
function AccountCard({ label, value, sub, color, icon }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className={`${color} rounded-xl p-5 text-white relative overflow-hidden flex-1`} style={{minWidth:200}}>
      <div className="absolute right-4 top-4 opacity-20 text-5xl">{icon}</div>
      <div className="text-xs font-semibold uppercase tracking-widest opacity-80 mb-2">{label}</div>
      <div className="flex items-center gap-2">
        <div className="text-2xl font-bold">
          {visible ? value : '₹XXXX.XX'}
        </div>
        <button onClick={() => setVisible(v => !v)} className="opacity-70 hover:opacity-100 text-sm">
          {visible ? '👁' : '👁‍🗨'}
        </button>
      </div>
      {sub && <div className="text-xs opacity-70 mt-1">{sub}</div>}
    </div>
  )
}

// ── Transaction row ───────────────────────────────────────────────────────────
function TxnRow({ txn }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 px-4 transition-colors">
      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
        txn.txn_type === 'CR' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      }`}>
        {txn.txn_type === 'CR' ? '↓' : '↑'}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-gray-800 truncate">{txn.description}</div>
        <div className="text-xs text-gray-400">{txn.date} · {txn.type} · {txn.utr?.slice(-8)}</div>
      </div>
      <div className={`text-sm font-bold ${txn.txn_type === 'CR' ? 'text-green-600' : 'text-red-600'}`}>
        {txn.txn_type === 'CR' ? '+' : '-'}₹{txn.amount.toLocaleString('en-IN', {minimumFractionDigits:2})}
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function BankDashboard() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const [overview, setOverview] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [activeTab, setActiveTab] = useState('overview')

  const user = state?.user || null

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    axios.get(`/api/bank/overview/${user.username}`)
      .then(r => { setOverview(r.data); setTransactions(r.data.recent_transactions || []) })
      .catch(() => {})
    document.title = `HDFC NetBanking — ${user.full_name}`
    return () => { document.title = 'HDFC Bank — NetBanking' }
  }, [user])

  if (!user) return null

  return (
    <div className="min-h-screen bg-gray-100">
      <TopBar user={user} onLogout={() => navigate('/login')} />

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Welcome banner */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                Hello <span className="text-hdfc-blue">{user.full_name.split(' ')[0]}</span>, welcome back!
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Customer ID: {user.customer_id} · Last login: {new Date().toLocaleString('en-IN')}
              </p>
            </div>
            <div className="hidden md:flex gap-3">
              {['Welcome to HDFC', 'Security Center', 'Explore Offers', 'Discover', 'Savings Ac', 'Invest Now'].map(item => (
                <div key={item} className="text-center cursor-pointer hover:opacity-80 transition-opacity">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center text-xl mb-1 border-2 border-blue-100">
                    {item === 'Welcome to HDFC' ? '🏦' :
                     item === 'Security Center' ? '🔐' :
                     item === 'Explore Offers' ? '🎁' :
                     item === 'Discover' ? '🔍' :
                     item === 'Savings Ac' ? '💰' : '📈'}
                  </div>
                  <div className="text-xs text-gray-600 font-medium" style={{fontSize:'10px'}}>{item}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Left main content */}
          <div className="flex-1 space-y-5">
            {/* Relationship overview cards */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-700">Relationship Overview</h3>
                <button className="text-xs text-hdfc-blue hover:underline">View All</button>
              </div>
              <div className="flex gap-4">
                <AccountCard
                  label="Transaction Accounts"
                  value={`₹${(overview?.balance || user.balance).toLocaleString('en-IN', {minimumFractionDigits:2})}`}
                  sub={`Available: ₹${(overview?.available_bal || user.available_bal).toLocaleString('en-IN', {minimumFractionDigits:2})}`}
                  color="bg-gradient-to-br from-purple-700 to-hdfc-blue"
                  icon="💳"
                />
                <AccountCard
                  label="Deposits"
                  value="₹0.00"
                  sub="Grow your money faster"
                  color="bg-gradient-to-br from-gray-500 to-gray-700"
                  icon="🏛"
                />
                <AccountCard
                  label="Loans"
                  value="₹0.00"
                  sub="Total Outstanding"
                  color="bg-gradient-to-br from-indigo-600 to-indigo-900"
                  icon="🏠"
                />
              </div>
            </div>

            {/* Account details */}
            <div className="card">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-700">Account Details</h3>
                <div className="flex gap-2">
                  {['Overview', 'Statements', 'Cheque Book'].map(t => (
                    <button key={t}
                      onClick={() => setActiveTab(t.toLowerCase())}
                      className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                        activeTab === t.toLowerCase()
                          ? 'bg-hdfc-blue text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}>{t}</button>
                  ))}
                </div>
              </div>

              <div className="p-5">
                <div className="grid grid-cols-3 gap-x-8 gap-y-4 text-sm">
                  {[
                    ['Account Number', overview?.account_number || user.account_number],
                    ['Account Type',   overview?.account_type   || user.account_type],
                    ['Account Holder', overview?.full_name      || user.full_name],
                    ['Branch',         overview?.branch         || user.branch],
                    ['IFSC Code',      overview?.ifsc           || user.ifsc],
                    ['Customer ID',    overview?.customer_id    || user.customer_id],
                    ['Email',          overview?.email          || user.email],
                    ['PAN',            overview?.pan_masked     || user.pan_masked],
                    ['Nominee',        overview?.nominee        || user.nominee],
                  ].map(([label, val]) => (
                    <div key={label}>
                      <div className="text-xs text-gray-400 font-medium uppercase tracking-wide">{label}</div>
                      <div className="text-gray-800 font-semibold mt-0.5">{val || '—'}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent transactions */}
            <div className="card">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-700">Recent Transactions</h3>
                <button className="text-xs text-hdfc-blue hover:underline">View All</button>
              </div>
              <div>
                {transactions.length > 0
                  ? transactions.slice(0,8).map((t, i) => <TxnRow key={i} txn={t} />)
                  : <div className="text-center py-8 text-gray-400 text-sm">Loading transactions...</div>
                }
              </div>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="w-72 space-y-5">
            {/* Quick actions */}
            <div className="card p-4">
              <h4 className="font-bold text-gray-700 text-sm mb-3">Quick Actions</h4>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { icon: '💸', label: 'Fund Transfer', color: 'bg-blue-50 text-blue-700' },
                  { icon: '📋', label: 'Pay Bills',     color: 'bg-green-50 text-green-700' },
                  { icon: '📱', label: 'Mobile Recharge', color: 'bg-purple-50 text-purple-700' },
                  { icon: '🏧', label: 'ATM Locator',   color: 'bg-orange-50 text-orange-700' },
                  { icon: '📊', label: 'Statements',    color: 'bg-teal-50 text-teal-700' },
                  { icon: '🔐', label: 'Change IPIN',   color: 'bg-red-50 text-red-700' },
                ].map(({ icon, label, color }) => (
                  <button key={label} className={`${color} rounded-lg p-3 text-center text-xs font-semibold hover:opacity-80 transition-opacity`}>
                    <div className="text-xl mb-1">{icon}</div>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Investments widget */}
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-gray-700 text-sm">Investments</h4>
                <button className="text-xs text-hdfc-blue hover:underline">View All</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: '📈', label: 'Mutual Funds' },
                  { icon: '📉', label: 'Demat & Securities' },
                  { icon: '🏛', label: 'NPS' },
                  { icon: '💎', label: 'PPF' },
                ].map(({ icon, label }) => (
                  <div key={label} className="text-center cursor-pointer hover:bg-gray-50 rounded-lg p-2 transition-colors">
                    <div className="text-2xl mb-1">{icon}</div>
                    <div className="text-xs text-gray-600 font-medium">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Loans widget */}
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-gray-700 text-sm">Loans</h4>
                <button className="text-xs text-hdfc-blue hover:underline">View All</button>
              </div>
              {[
                { icon: '👤', label: 'Personal Loan' },
                { icon: '💼', label: 'Loan Against MF' },
                { icon: '🏠', label: 'Home Loan' },
                { icon: '🥇', label: 'Gold Loan' },
              ].map(({ icon, label }) => (
                <div key={label} className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0 cursor-pointer hover:text-hdfc-blue transition-colors">
                  <span className="text-lg">{icon}</span>
                  <span className="text-sm text-gray-700">{label}</span>
                  <span className="ml-auto text-gray-300">›</span>
                </div>
              ))}
            </div>

            {/* Security badge */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-green-600 text-lg">🛡</span>
                <span className="text-sm font-bold text-green-800">Session Secured</span>
              </div>
              <p className="text-xs text-green-700">
                Your session is protected by ML-based behavioral authentication and 2FA.
              </p>
              <button className="mt-2 text-xs text-green-700 font-semibold hover:underline">
                View Security Details →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-10 bg-hdfc-navy text-gray-400 text-xs py-6">
        <div className="max-w-7xl mx-auto px-4 flex flex-wrap gap-4 justify-center">
          {['Privacy Policy','Terms of Use','Disclaimer','Customer Rights Policy','Rates & Charges'].map(l => (
            <span key={l} className="cursor-pointer hover:text-white">{l}</span>
          ))}
        </div>
        <div className="text-center mt-3 text-gray-600">
          © 2025 HDFC Bank Ltd. All rights reserved. | CIN: L65920MH1994PLC080618
        </div>
      </div>
    </div>
  )
}
