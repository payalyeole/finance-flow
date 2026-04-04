import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.username.trim()) e.username = 'Username is required';
    if (!form.password.trim()) e.password = 'Password is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await login(form.username, form.password);
      success('Welcome back!');
      navigate('/');
    } catch (err) {
      error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const fill = (username, password) => setForm({ username, password });

  return (
    <div className="login-page">
      <div className="login-bg" />
      <div className="login-card">
        <div className="login-logo">
          <h1>Finance<span>Flow</span></h1>
          <p>Financial Management System</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username</label>
            <input
              className="form-input"
              type="text"
              placeholder="Enter username"
              value={form.username}
              onChange={e => { setForm(f => ({...f, username: e.target.value})); setErrors({}); }}
              autoFocus
            />
            {errors.username && <div className="form-error">{errors.username}</div>}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="Enter password"
              value={form.password}
              onChange={e => { setForm(f => ({...f, password: e.target.value})); setErrors({}); }}
            />
            {errors.password && <div className="form-error">{errors.password}</div>}
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading} style={{width:'100%', justifyContent:'center', marginTop: 8}}>
            {loading ? <><span className="spinner" style={{width:16,height:16}} /> Signing in...</> : 'Sign In →'}
          </button>
        </form>

        <div className="login-hint">
          <strong>Demo Credentials:</strong><br/>
          admin / admin123 &nbsp;·&nbsp; analyst / analyst123 &nbsp;·&nbsp; viewer / viewer123
          <div style={{marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap'}}>
            {[['admin','admin123'],['analyst','analyst123'],['viewer','viewer123']].map(([u,p]) => (
              <button key={u} onClick={() => fill(u,p)}
                style={{background:'var(--bg-elevated)',border:'1px solid var(--border)',borderRadius:4,
                  color:'var(--text-muted)',padding:'2px 8px',cursor:'pointer',fontSize:'0.7rem',fontFamily:'var(--font-mono)'}}>
                {u}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
