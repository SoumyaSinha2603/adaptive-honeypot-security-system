import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import axios from 'axios'

function HoneypotNav({ active, onNav, handleLogout }) {
  const tabs = ['dashboard','transactions','transfer','beneficiary','settings']
  return (
    <>
      <div className="bg-hdfc-navy text-xs text-gray-300 px-6 py-1.5 flex justify-between">
        <span>Customer Care: 1800-202-6161 (Toll Free)</span>
        <span>
  English |
  <button
    onClick={handleLogout}
    className="ml-1 text-white hover:underline"
  >
    Logout
  </button>
</span>
      </div>
      <div className="bg-white shadow-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center h-14">
            <div className="flex flex-col leading-none mr-8">
              <span className="text-hdfc-red font-extrabold text-xl tracking-tight">HDFC</span>
              <span className="text-hdfc-blue font-bold text-xs tracking-widest">BANK</span>
            </div>
            {['Banking','Lifestyle','Rewards'].map((t,i) => (
              <button key={t} className={`px-4 h-14 text-sm font-semibold border-b-2 transition-colors ${
                i===0 ? 'border-hdfc-red text-hdfc-red' : 'border-transparent text-gray-600 hover:text-hdfc-blue'
              }`}>{t}</button>
            ))}
            <div className="ml-auto flex items-center gap-3">
              <div className="flex items-center gap-2 bg-hdfc-blue text-white px-3 py-1.5 rounded-full text-sm font-semibold">
                <span className="w-7 h-7 bg-hdfc-red rounded-full flex items-center justify-center text-xs font-bold">R</span>
                <span>My Profile</span>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex gap-0">
              {tabs.map(tab => (
                <button key={tab}
                  onClick={() => onNav(tab)}
                  className={`px-5 py-2.5 text-xs font-semibold border-b-2 capitalize transition-colors ${
                    active === tab
                      ? 'border-hdfc-blue text-hdfc-blue'
                      : 'border-transparent text-gray-600 hover:text-hdfc-blue hover:border-gray-300'
                  }`}>
                  {tab === 'dashboard' ? 'My Accounts' : tab}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function Dashboard({ sessionId }) {
  const [data, setData] = useState(null)
  useEffect(() => {
    axios.get(`/api/honeypot/dashboard/${sessionId}`).then(r => setData(r.data))
  }, [sessionId])
  if (!data) return <div className="text-center py-16 text-gray-400">Loading...</div>
  const { account, recent_transactions: txns } = data
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-purple-700 to-hdfc-blue rounded-xl p-6 text-white flex items-center justify-between shadow-md">
        <div>
          <div className="text-xs uppercase tracking-widest opacity-70 mb-1">{account.account_type}</div>
          <div className="text-lg font-semibold opacity-80">A/C: {account.account_number}</div>
          <div className="text-xs opacity-60 mt-1">Branch: {account.branch} · IFSC: {account.ifsc}</div>
        </div>
        <div className="text-right">
          <div className="text-xs opacity-70">Current Balance</div>
          <div className="text-3xl font-bold mt-1">₹{account.balance.toLocaleString('en-IN', {minimumFractionDigits:2})}</div>
          <div className="text-sm opacity-70 mt-1">Available: ₹{account.available_balance.toLocaleString('en-IN', {minimumFractionDigits:2})}</div>
        </div>
      </div>
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-700">Recent Transactions</h3>
          <button className="text-xs text-hdfc-blue hover:underline">View All</button>
        </div>
        {txns.map((t,i) => (
          <div key={i} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 px-5 transition-colors">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
              t.txn_type==='CR' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>{t.txn_type==='CR'?'↓':'↑'}</div>
            <div className="flex-1"><div className="text-sm font-semibold text-gray-800">{t.description}</div>
              <div className="text-xs text-gray-400">{t.date} · {t.type} · {t.utr?.slice(-8)}</div></div>
            <div className={`text-sm font-bold ${t.txn_type==='CR'?'text-green-600':'text-red-600'}`}>
              {t.txn_type==='CR'?'+':'-'}₹{t.amount.toLocaleString('en-IN',{minimumFractionDigits:2})}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Transactions({ sessionId }) {
  const [txns, setTxns] = useState([])
  useEffect(() => {
    axios.get(`/api/honeypot/transactions/${sessionId}`).then(r => setTxns(r.data.transactions))
  }, [sessionId])
  return (
    <div className="card">
      <div className="px-5 py-4 border-b border-gray-100"><h3 className="font-bold text-gray-700">Transaction History (Last 90 days)</h3></div>
      {txns.map((t,i) => (
        <div key={i} className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 px-5 transition-colors">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${
            t.txn_type==='CR' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>{t.txn_type==='CR'?'↓':'↑'}</div>
          <div className="flex-1"><div className="text-sm font-semibold text-gray-800">{t.description}</div>
            <div className="text-xs text-gray-400">{t.date} · {t.type}</div></div>
          <div className="text-xs text-gray-400 mr-4">{t.utr}</div>
          <div className={`text-sm font-bold ${t.txn_type==='CR'?'text-green-600':'text-red-600'}`}>
            {t.txn_type==='CR'?'+':'-'}₹{t.amount.toLocaleString('en-IN',{minimumFractionDigits:2})}
          </div>
        </div>
      ))}
    </div>
  )
}

function Transfer({ sessionId }) {
  const [form, setForm] = useState({ destination:'', amount:'', name:'', type:'IMPS' })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const submit = async () => {
    if (!form.destination || !form.amount) return
    setLoading(true)
    const { data } = await axios.post('/api/honeypot/transfer', {
      session_id: sessionId, destination: form.destination,
      amount: parseFloat(form.amount), transfer_type: form.type, beneficiary_name: form.name,
    })
    setResult(data); setLoading(false)
  }
  if (result) return (
    <div className="card p-12 text-center max-w-md mx-auto">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">✓</div>
      <h2 className="text-xl font-bold text-green-600 mb-2">Transfer Successful!</h2>
      <p className="text-gray-600 text-sm">UTR: <span className="font-mono font-bold">{result.utr_number}</span></p>
      <p className="text-gray-600 text-sm mt-1">Amount: ₹{result.amount?.toLocaleString('en-IN', {minimumFractionDigits:2})}</p>
      <p className="text-gray-400 text-xs mt-2">{result.timestamp}</p>
      <button onClick={() => setResult(null)} className="mt-6 hdfc-btn-primary">New Transfer</button>
    </div>
  )
  return (
    <div className="max-w-lg">
      <div className="card p-6 space-y-4">
        <h3 className="font-bold text-gray-700 text-lg border-b border-gray-100 pb-3">Fund Transfer</h3>
        {[['Destination Account','destination','text','Account number'],
          ['Beneficiary Name','name','text','Full name'],
          ['Amount (₹)','amount','number','0.00']].map(([label,key,type,ph]) => (
          <div key={key}>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">{label}</label>
            <input type={type} value={form[key]} onChange={e=>setForm(p=>({...p,[key]:e.target.value}))}
              placeholder={ph} className="hdfc-input"/>
          </div>
        ))}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">Transfer Mode</label>
          <select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))} className="hdfc-input">
            {['IMPS','NEFT','RTGS','UPI'].map(t=><option key={t}>{t}</option>)}
          </select>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-xs text-yellow-700">
          ⚠️ Please verify beneficiary details before proceeding. Transfers cannot be reversed.
        </div>
        <button onClick={submit} disabled={loading} className="w-full hdfc-btn-primary py-3 disabled:opacity-50">
          {loading ? 'Processing...' : 'Confirm Transfer'}
        </button>
      </div>
    </div>
  )
}

function Beneficiary({ sessionId }) {
  const [benes, setBenes] = useState([])
  const [form, setForm] = useState({ name:'', account_number:'', bank:'' })
  const [added, setAdded] = useState(false)
  useEffect(() => {
    axios.get(`/api/honeypot/beneficiaries/${sessionId}`).then(r => setBenes(r.data.beneficiaries))
  }, [sessionId])
  const add = async () => {
    await axios.post('/api/honeypot/beneficiaries/add', { session_id: sessionId, ...form })
    setAdded(true); setBenes(p => [...p, { ...form, ifsc:'HDFC0001234' }])
    setForm({ name:'', account_number:'', bank:'' })
    setTimeout(() => setAdded(false), 3000)
  }
  return (
    <div className="space-y-5">
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100"><h3 className="font-bold text-gray-700">Registered Beneficiaries</h3></div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50"><tr>{['Name','Account','Bank','IFSC'].map(h=><th key={h} className="text-left text-xs text-gray-500 font-semibold px-5 py-3 uppercase tracking-wide">{h}</th>)}</tr></thead>
          <tbody>
            {benes.map((b,i)=>(
              <tr key={i} className="border-t border-gray-50 hover:bg-gray-50">
                <td className="px-5 py-3 font-semibold text-gray-800">{b.name}</td>
                <td className="px-5 py-3 text-gray-600 font-mono">XXXX{b.account_number?.slice(-4)}</td>
                <td className="px-5 py-3 text-gray-600">{b.bank}</td>
                <td className="px-5 py-3 text-gray-600 font-mono">{b.ifsc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card p-5 max-w-md">
        <h4 className="font-bold text-gray-700 mb-4">Add New Beneficiary</h4>
        {added && <div className="bg-green-50 text-green-700 text-sm px-3 py-2 rounded mb-3 border border-green-200">✓ Beneficiary added successfully. Active after 30 minutes.</div>}
        {[['Beneficiary Name','name'],['Account Number','account_number'],['Bank Name','bank']].map(([l,k])=>(
          <div key={k} className="mb-3">
            <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wide">{l}</label>
            <input value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} className="hdfc-input"/>
          </div>
        ))}
        <button onClick={add} className="hdfc-btn-primary mt-2">Add Beneficiary</button>
      </div>
    </div>
  )
}

function Settings() {
  return (
    <div className="card p-6 max-w-lg space-y-4">
      <h3 className="font-bold text-gray-700 text-lg border-b border-gray-100 pb-3">Account Settings</h3>
      {[['Name','Rajesh Kumar'],['Email','r*****r@gmail.com'],['Mobile','+91 98XXXXX210'],
        ['Address','123, MG Road, Bengaluru — 560001'],['Nominee','Sunita Kumar'],['PAN','ABCPK****D']].map(([k,v])=>(
        <div key={k} className="flex py-3 border-b border-gray-50 last:border-0">
          <span className="text-gray-400 text-sm w-36">{k}</span>
          <span className="text-gray-800 text-sm font-semibold">{v}</span>
        </div>
      ))}
      <div className="pt-3 space-y-2">
        {['Change IPIN','Two-Factor Authentication','Login Alerts','Linked Devices'].map(item=>(
          <div key={item} className="flex justify-between items-center py-2">
            <span className="text-sm text-gray-700">{item}</span>
            <button className="text-xs text-hdfc-blue border border-blue-200 px-3 py-1 rounded hover:bg-blue-50 transition-colors">Manage</button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function HoneypotPortal() {
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session') || 'demo-session'
  const [tab, setTab] = useState('dashboard')
  const clicksRef = useRef(0)
  const navigate = useNavigate()
  const handleLogout = () => {
  navigate('/')
}

  useEffect(() => {
    const interval = setInterval(() => {
      axios.post('/api/honeypot/telemetry', {
        session_id: sessionId,
        session_duration: (Date.now() - window._hpStart) / 1000,
        click_frequency: clicksRef.current,
        automation_score: 0.1,
      }).catch(() => {})
    }, 5000)
    window._hpStart = window._hpStart || Date.now()
    const onClick = () => clicksRef.current++
    document.addEventListener('click', onClick)
    return () => { clearInterval(interval); document.removeEventListener('click', onClick) }
  }, [sessionId])

  const TABS = { dashboard: Dashboard, transactions: Transactions, transfer: Transfer, beneficiary: Beneficiary, settings: Settings }
  const TabComponent = TABS[tab]

  return (
    <div className="min-h-screen bg-gray-100">
      <HoneypotNav active={tab} onNav={setTab} handleLogout={handleLogout} />
      <div className="max-w-7xl mx-auto px-4 py-6">
        <TabComponent sessionId={sessionId} />
      </div>
    </div>
  )
}
