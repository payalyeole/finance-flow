import React, { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { dashboardAPI } from '../services/api';

const fmt = (v) => {
  const n = Number(v);
  if (n >= 1000) return `$${(n/1000).toFixed(1)}k`;
  return `$${n.toFixed(0)}`;
};

const fmtFull = (v) => `$${Number(v).toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2})}`;

const COLORS_INCOME = ['#6ee7b7','#34d399','#10b981','#059669','#047857'];
const COLORS_EXPENSE = ['#f87171','#ef4444','#dc2626','#b91c1c','#991b1b'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{background:'var(--bg-elevated)',border:'1px solid var(--border-light)',borderRadius:8,padding:'10px 14px',fontSize:'0.8rem',fontFamily:'var(--font-mono)'}}>
      <div style={{color:'var(--text-muted)',marginBottom:6}}>{label}</div>
      {payload.map(p => (
        <div key={p.name} style={{color:p.color}}>{p.name}: {fmtFull(p.value)}</div>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getSummary(8, 6)
      .then(res => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="main-content">
      <div className="loader"><div className="spinner" /> Loading dashboard...</div>
    </div>
  );

  if (!data) return <div className="main-content"><div className="loader">Failed to load</div></div>;

  const incomeCats = Object.entries(data.incomeByCategory || {}).map(([k,v]) => ({name:k, value:Number(v)}));
  const expenseCats = Object.entries(data.expensesByCategory || {}).map(([k,v]) => ({name:k, value:Number(v)}));
  const trends = data.monthlyTrends || [];

  return (
    <div className="main-content">
      <div className="page-header">
        <div>
          <h2 className="page-title">Dashboard</h2>
          <p className="page-subtitle">Financial overview & analytics</p>
        </div>
      </div>
      <div className="page-body">

        {/* Stats */}
        <div className="stats-grid">
          <div className="stat-card income">
            <div className="stat-icon">↑</div>
            <div className="stat-label">Total Income</div>
            <div className="stat-value">{fmt(data.totalIncome)}</div>
            <div style={{fontSize:'0.7rem',color:'var(--text-muted)',fontFamily:'var(--font-mono)'}}>
              {fmtFull(data.totalIncome)}
            </div>
          </div>
          <div className="stat-card expense">
            <div className="stat-icon">↓</div>
            <div className="stat-label">Total Expenses</div>
            <div className="stat-value">{fmt(data.totalExpenses)}</div>
            <div style={{fontSize:'0.7rem',color:'var(--text-muted)',fontFamily:'var(--font-mono)'}}>
              {fmtFull(data.totalExpenses)}
            </div>
          </div>
          <div className="stat-card balance">
            <div className="stat-icon">≈</div>
            <div className="stat-label">Net Balance</div>
            <div className="stat-value">{fmt(data.netBalance)}</div>
            <div style={{fontSize:'0.7rem',color:'var(--text-muted)',fontFamily:'var(--font-mono)'}}>
              {fmtFull(data.netBalance)}
            </div>
          </div>
        </div>

        {/* Monthly Trend */}
        <div className="card" style={{marginBottom:16}}>
          <div className="card-title">Monthly Trend — Income vs Expenses</div>
          <div className="chart-container" style={{height:240}}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{top:10,right:10,left:0,bottom:0}}>
                <defs>
                  <linearGradient id="incG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6ee7b7" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#6ee7b7" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="expG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f87171" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#f87171" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                <XAxis dataKey="monthLabel" tick={{fill:'var(--text-muted)',fontSize:11,fontFamily:'var(--font-mono)'}} axisLine={false} tickLine={false}/>
                <YAxis tickFormatter={fmt} tick={{fill:'var(--text-muted)',fontSize:11,fontFamily:'var(--font-mono)'}} axisLine={false} tickLine={false}/>
                <Tooltip content={<CustomTooltip />}/>
                <Area type="monotone" dataKey="income" name="Income" stroke="#6ee7b7" strokeWidth={2} fill="url(#incG)"/>
                <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#f87171" strokeWidth={2} fill="url(#expG)"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdowns */}
        <div className="grid-2" style={{marginBottom:16}}>
          <div className="card">
            <div className="card-title">Income by Category</div>
            {incomeCats.length ? (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={incomeCats} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                      {incomeCats.map((_, i) => <Cell key={i} fill={COLORS_INCOME[i % COLORS_INCOME.length]}/>)}
                    </Pie>
                    <Tooltip formatter={(v) => fmtFull(v)} contentStyle={{background:'var(--bg-elevated)',border:'1px solid var(--border-light)',borderRadius:8,fontFamily:'var(--font-mono)',fontSize:'0.8rem'}}/>
                    <Legend iconType="circle" wrapperStyle={{fontSize:'0.75rem',fontFamily:'var(--font-mono)',color:'var(--text-muted)'}}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : <div className="empty-state"><p>No data</p></div>}
          </div>
          <div className="card">
            <div className="card-title">Expenses by Category</div>
            {expenseCats.length ? (
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={expenseCats} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                      {expenseCats.map((_, i) => <Cell key={i} fill={COLORS_EXPENSE[i % COLORS_EXPENSE.length]}/>)}
                    </Pie>
                    <Tooltip formatter={(v) => fmtFull(v)} contentStyle={{background:'var(--bg-elevated)',border:'1px solid var(--border-light)',borderRadius:8,fontFamily:'var(--font-mono)',fontSize:'0.8rem'}}/>
                    <Legend iconType="circle" wrapperStyle={{fontSize:'0.75rem',fontFamily:'var(--font-mono)',color:'var(--text-muted)'}}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : <div className="empty-state"><p>No data</p></div>}
          </div>
        </div>

        {/* Net Bar Chart */}
        <div className="card" style={{marginBottom:16}}>
          <div className="card-title">Net Balance per Month</div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trends} margin={{top:10,right:10,left:0,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                <XAxis dataKey="monthLabel" tick={{fill:'var(--text-muted)',fontSize:11,fontFamily:'var(--font-mono)'}} axisLine={false} tickLine={false}/>
                <YAxis tickFormatter={fmt} tick={{fill:'var(--text-muted)',fontSize:11,fontFamily:'var(--font-mono)'}} axisLine={false} tickLine={false}/>
                <Tooltip content={<CustomTooltip />}/>
                <Bar dataKey="net" name="Net" radius={[4,4,0,0]}>
                  {trends.map((t,i) => <Cell key={i} fill={t.net >= 0 ? '#6ee7b7' : '#f87171'}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="card-title">Recent Activity</div>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Category</th>
                  <th>Notes</th>
                  <th>Amount</th>
                  <th>By</th>
                </tr>
              </thead>
              <tbody>
                {data.recentActivity?.map(tx => (
                  <tr key={tx.id}>
                    <td style={{fontFamily:'var(--font-mono)',fontSize:'0.8rem',color:'var(--text-muted)'}}>{tx.date}</td>
                    <td><span className={`badge badge-${tx.type.toLowerCase()}`}>{tx.type}</span></td>
                    <td>{tx.category}</td>
                    <td style={{color:'var(--text-muted)',fontSize:'0.85rem'}}>{tx.notes || '—'}</td>
                    <td className={`amount-${tx.type.toLowerCase()}`} style={{fontFamily:'var(--font-mono)',fontWeight:600}}>
                      {tx.type === 'INCOME' ? '+' : '-'}{fmtFull(tx.amount)}
                    </td>
                    <td style={{color:'var(--text-muted)',fontSize:'0.8rem',fontFamily:'var(--font-mono)'}}>{tx.createdBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
