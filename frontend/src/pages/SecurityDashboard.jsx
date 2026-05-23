import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

const COLORS = ['#E31837','#f97316','#eab308','#22c55e','#3b82f6']
const TRIGGER_COLORS = ['#3b82f6','#f97316','#8b5cf6','#ef4444']
const API = '/api/dashboard'

function StatCard({ label, value, sub, accent }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <div className="text-gray-400 text-xs uppercase tracking-wider">{label}</div>
      <div className={`text-3xl font-bold mt-1 ${accent}`}>{value}</div>
      {sub && <div className="text-gray-600 text-xs mt-0.5">{sub}</div>}
    </div>
  )
}

export default function SecurityDashboard() {
  const [overview,    setOverview]    = useState(null)
  const [attackTypes, setAttackTypes] = useState([])
  const [timeline,    setTimeline]    = useState([])
  const [sessions,    setSessions]    = useState([])
  const [confDist,    setConfDist]    = useState([])
  const [triggers,    setTriggers]    = useState([])
  const [refreshing,  setRefreshing]  = useState(false)
  const [lastRefresh, setLastRefresh] = useState(new Date())

  const fetchAll = async () => {
    setRefreshing(true)
    try {
      const [ov, at, tl, ss, cd, tr] = await Promise.all([
        axios.get(`${API}/overview`),
        axios.get(`${API}/attack-types`),
        axios.get(`${API}/timeline`),
        axios.get(`${API}/recent-sessions`),
        axios.get(`${API}/confidence-distribution`),
        axios.get(`${API}/trigger-breakdown`),
      ])
      setOverview(ov.data); setAttackTypes(at.data.data)
      setTimeline(tl.data.data); setSessions(ss.data.sessions)
      setConfDist(cd.data.data); setTriggers(tr.data.data)
      setLastRefresh(new Date())
    } catch {}
    setRefreshing(false)
  }

  useEffect(() => { fetchAll(); const i = setInterval(fetchAll, 15000); return () => clearInterval(i) }, [])

  const ATTACK_COLORS = {
    brute_force_bot:    'bg-red-900/40 text-red-300 border border-red-800',
    credential_stuffing:'bg-orange-900/40 text-orange-300 border border-orange-800',
    automated_script:   'bg-yellow-900/40 text-yellow-300 border border-yellow-800',
    manual_attacker:    'bg-blue-900/40 text-blue-300 border border-blue-800',
    reconnaissance:     'bg-purple-900/40 text-purple-300 border border-purple-800',
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex flex-col leading-none">
              <span className="text-hdfc-red font-extrabold text-xl tracking-tight">HDFC</span>
              <span className="text-hdfc-blue font-bold text-xs tracking-widest">BANK</span>
            </div>
            <div className="h-8 w-px bg-gray-700" />
            <div>
              <h1 className="text-lg font-bold text-white">Honeypot Security Dashboard</h1>
              <p className="text-gray-500 text-xs">Live Attack Intelligence · v2.0 · 21-feature ML</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-green-400 text-xs font-medium">Live</span>
            </div>
            <span className="text-gray-600 text-xs">Last: {lastRefresh.toLocaleTimeString()}</span>
            <button onClick={fetchAll} disabled={refreshing}
              className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-300 text-xs px-4 py-2 rounded-lg transition-colors">
              {refreshing ? '⟳ Refreshing...' : '⟳ Refresh'}
            </button>
            <a href="/login" className="bg-hdfc-red hover:bg-red-700 text-white text-xs px-4 py-2 rounded-lg transition-colors font-semibold">
              → Test Login
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Stat cards */}
        {overview && (
          <div className="grid grid-cols-5 gap-4">
            <StatCard label="Total Attacks" value={overview.total_attacks} sub="all time" accent="text-red-400" />
            <StatCard label="Last 24 Hours" value={overview.attacks_24h} sub="sessions" accent="text-orange-400" />
            <StatCard label="Novel Attacks" value={overview.novel_attacks_7d} sub="last 7 days" accent="text-purple-400" />
            <StatCard label="Attempted Value" value={`₹${(overview.total_attempted_value/1000).toFixed(0)}K`} sub="fake transfers" accent="text-yellow-400" />
            <StatCard label="Total Sessions" value={overview.total_sessions} sub="honeypot" accent="text-blue-400" />
          </div>
        )}

        {/* Charts row */}
        <div className="grid grid-cols-3 gap-4">
          {/* Timeline */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-4">Attacks — Last 24h</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeline}>
                  <XAxis dataKey="hour" tick={{fill:'#4b5563',fontSize:10}} tickLine={false} interval={3}/>
                  <YAxis tick={{fill:'#4b5563',fontSize:10}} tickLine={false} axisLine={false}/>
                  <Tooltip contentStyle={{background:'#111827',border:'1px solid #374151',borderRadius:8}}
                    labelStyle={{color:'#9ca3af'}} itemStyle={{color:'#E31837'}}/>
                  <Line type="monotone" dataKey="attacks" stroke="#E31837" strokeWidth={2} dot={false}/>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Attack types */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-4">Attack Type Distribution</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={attackTypes} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}
                    label={({name,percent})=>`${name.replace(/_/g,' ').slice(0,8)} ${(percent*100).toFixed(0)}%`} labelLine={false} fontSize={8}>
                    {attackTypes.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                  </Pie>
                  <Tooltip contentStyle={{background:'#111827',border:'1px solid #374151',borderRadius:8}}
                    formatter={(v,n)=>[v,n.replace(/_/g,' ')]}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Confidence */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-4">ML Confidence Distribution</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={confDist} barCategoryGap="30%">
                  <XAxis dataKey="range" tick={{fill:'#4b5563',fontSize:9}} tickLine={false}/>
                  <YAxis tick={{fill:'#4b5563',fontSize:10}} tickLine={false} axisLine={false}/>
                  <Tooltip contentStyle={{background:'#111827',border:'1px solid #374151',borderRadius:8}} cursor={{fill:'rgba(255,255,255,0.05)'}}/>
                  <Bar dataKey="count" fill="#E31837" radius={[4,4,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Second row */}
        <div className="grid grid-cols-3 gap-4">
          {/* Triggers */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-4">Detection Triggers</h3>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={triggers} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60}
                    label={({name,percent})=>`${name.slice(0,8)} ${(percent*100).toFixed(0)}%`} fontSize={9}>
                    {triggers.map((_,i)=><Cell key={i} fill={TRIGGER_COLORS[i%TRIGGER_COLORS.length]}/>)}
                  </Pie>
                  <Tooltip contentStyle={{background:'#111827',border:'1px solid #374151',borderRadius:8}}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* New features legend */}
          <div className="col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-4">New in v2 — 21-Feature ML + Multi-Layer Security</h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                {label:'Keystroke variance',    desc:'Near-zero variance = bot typing uniformity'},
                {label:'Scroll depth',          desc:'Bots never scroll; humans always do'},
                {label:'Copy-paste detection',  desc:'Programmatic field fill vs real typing'},
                {label:'Reading time',          desc:'Sub-1s = instant bot; 3–8s = human reads'},
                {label:'Hesitation count',      desc:'Pauses mid-typing = human cognition'},
                {label:'Mouse path curvature',  desc:'Straight lines = bot; curves = human'},
                {label:'Behavioral baseline',   desc:'Per-user drift detection across logins'},
                {label:'Impossible travel',     desc:'Same user, different geo in short time'},
              ].map(({label,desc})=>(
                <div key={label} className="flex gap-2">
                  <span className="text-purple-400 font-semibold whitespace-nowrap">{label}</span>
                  <span className="text-gray-500">{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sessions table */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-gray-400 text-xs uppercase tracking-wider mb-4">
            Recent Attack Sessions ({sessions.length})
          </h3>
          {sessions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-800">
                    {['Session','Time','IP','Confidence','Attack Type','Pages','Transfers','Trigger','Drift','Novel'].map(h => (
                      <th key={h} className="text-left text-gray-500 font-semibold pb-3 pr-4 uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s,i) => (
                    <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                      <td className="py-3 pr-4 font-mono text-gray-400">{s.session_id}</td>
                      <td className="py-3 pr-4 text-gray-400 whitespace-nowrap">{s.created_at}</td>
                      <td className="py-3 pr-4 font-mono text-gray-300">{s.ip_address}</td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="w-14 bg-gray-800 rounded-full h-1.5">
                            <div className="bg-hdfc-red rounded-full h-1.5" style={{width:`${s.confidence}%`}}/>
                          </div>
                          <span className="text-gray-400">{s.confidence}%</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        {s.attack_type ? (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ATTACK_COLORS[s.attack_type] || 'bg-gray-800 text-gray-400'}`}>
                            {s.attack_type.replace(/_/g,' ')}
                          </span>
                        ) : <span className="text-gray-600">—</span>}
                      </td>
                      <td className="py-3 pr-4 text-gray-400 text-center">{s.pages_visited}</td>
                      <td className="py-3 pr-4 text-center">
                        <span className={s.transfer_attempts > 0 ? 'text-red-400 font-bold' : 'text-gray-600'}>
                          {s.transfer_attempts}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          s.trigger === 'rule_based' ? 'bg-orange-900/40 text-orange-300' :
                          s.trigger === 'baseline_drift' ? 'bg-purple-900/40 text-purple-300' :
                          s.trigger === 'impossible_travel' ? 'bg-pink-900/40 text-pink-300' :
                          'bg-blue-900/40 text-blue-300'
                        }`}>
                          {s.trigger === 'ml_model1' ? 'ML' :
                           s.trigger === 'rule_based' ? 'rule' :
                           s.trigger === 'baseline_drift' ? 'drift' : 'travel'}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-center">
                        {s.baseline_drift > 0 ? (
                          <span className={`text-xs font-medium ${s.baseline_drift > 0.5 ? 'text-red-400' : 'text-yellow-400'}`}>
                            {s.baseline_drift}
                          </span>
                        ) : <span className="text-gray-700">—</span>}
                      </td>
                      <td className="py-3 text-center">
                        {s.is_novel && <span className="bg-purple-900/40 border border-purple-700 text-purple-300 text-xs px-2 py-0.5 rounded-full font-bold">NEW</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-600">
              No sessions yet.{' '}
              <a href="/login" className="text-blue-400 hover:underline">Trigger one from the login page →</a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
