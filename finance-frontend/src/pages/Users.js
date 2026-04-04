import React, { useState, useEffect, useCallback } from 'react';
import { userAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

const ROLES = ['VIEWER', 'ANALYST', 'ADMIN'];

function UserModal({ user, onClose, onSaved }) {
  const toast = useToast();
  const isEdit = !!user?.id;
  const [form, setForm] = useState({
    username: user?.username || '',
    password: '',
    email: user?.email || '',
    fullName: user?.fullName || '',
    role: user?.role || 'VIEWER',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!isEdit && !form.username.trim()) e.username = 'Username required';
    if (!isEdit && !form.password) e.password = 'Password required (min 6 chars)';
    if (!isEdit && form.password && form.password.length < 6) e.password = 'Min 6 characters';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Valid email required';
    if (!form.fullName.trim()) e.fullName = 'Full name required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      if (isEdit) {
        const payload = { email: form.email, fullName: form.fullName, role: form.role };
        if (form.password) payload.password = form.password;
        await userAPI.update(user.id, payload);
        toast.success('User updated');
      } else {
        await userAPI.create(form);
        toast.success('User created');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  const set = (k, v) => { setForm(f => ({...f, [k]: v})); setErrors(er => ({...er, [k]: undefined})); };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{isEdit ? 'Edit User' : 'New User'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Username</label>
                <input className="form-input" placeholder="username" value={form.username}
                  onChange={e => set('username', e.target.value)} disabled={isEdit}
                  style={isEdit ? {opacity:0.5} : {}}/>
                {errors.username && <div className="form-error">{errors.username}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">{isEdit ? 'New Password (optional)' : 'Password'}</label>
                <input className="form-input" type="password" placeholder="••••••"
                  value={form.password} onChange={e => set('password', e.target.value)}/>
                {errors.password && <div className="form-error">{errors.password}</div>}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" placeholder="Jane Doe" value={form.fullName}
                onChange={e => set('fullName', e.target.value)}/>
              {errors.fullName && <div className="form-error">{errors.fullName}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="user@company.com"
                value={form.email} onChange={e => set('email', e.target.value)}/>
              {errors.email && <div className="form-error">{errors.email}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-select" value={form.role} onChange={e => set('role', e.target.value)}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfirmModal({ message, onConfirm, onClose, danger = true }) {
  const [loading, setLoading] = useState(false);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{maxWidth:380}} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Confirm Action</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p className="confirm-text">{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} disabled={loading}
            onClick={async () => { setLoading(true); await onConfirm(); setLoading(false); }}>
            {loading ? 'Processing...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Users() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await userAPI.getAll();
      setUsers(res.data.data);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (u) => {
    try {
      await userAPI.toggleStatus(u.id);
      toast.success(`User ${u.active ? 'deactivated' : 'activated'}`);
      load();
    } catch { toast.error('Failed to update status'); }
    setModal(null);
  };

  const handleDelete = async (id) => {
    try {
      await userAPI.delete(id);
      toast.success('User deleted');
      load();
    } catch (e) { toast.error(e.response?.data?.message || 'Delete failed'); }
    setModal(null);
  };

  const roleColors = { ADMIN: 'badge-admin', ANALYST: 'badge-analyst', VIEWER: 'badge-viewer' };

  return (
    <div className="main-content">
      <div className="page-header">
        <div>
          <h2 className="page-title">Users</h2>
          <p className="page-subtitle">{users.length} users registered</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({type:'create'})}>
          + New User
        </button>
      </div>

      <div className="page-body">
        <div className="card">
          {loading ? (
            <div className="loader"><div className="spinner"/> Loading...</div>
          ) : users.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">◎</div>
              <p>No users found</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Name</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td style={{fontFamily:'var(--font-mono)',color:'var(--text-dim)',fontSize:'0.8rem'}}>#{u.id}</td>
                      <td style={{fontWeight:600}}>{u.fullName}</td>
                      <td style={{fontFamily:'var(--font-mono)',fontSize:'0.85rem',color:'var(--text-muted)'}}>{u.username}</td>
                      <td style={{fontSize:'0.85rem',color:'var(--text-muted)'}}>{u.email}</td>
                      <td><span className={`badge ${roleColors[u.role]}`}>{u.role}</span></td>
                      <td><span className={`badge ${u.active ? 'badge-active' : 'badge-inactive'}`}>{u.active ? 'Active' : 'Inactive'}</span></td>
                      <td style={{fontFamily:'var(--font-mono)',fontSize:'0.75rem',color:'var(--text-dim)'}}>
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                      </td>
                      <td>
                        <div style={{display:'flex',gap:6}}>
                          <button className="btn btn-ghost btn-sm" onClick={() => setModal({type:'edit',user:u})}>Edit</button>
                          <button className="btn btn-secondary btn-sm"
                            onClick={() => setModal({type:'toggle',user:u})}>
                            {u.active ? 'Disable' : 'Enable'}
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => setModal({type:'delete',user:u})}>Del</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {modal?.type === 'create' && (
        <UserModal onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }}/>
      )}
      {modal?.type === 'edit' && (
        <UserModal user={modal.user} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }}/>
      )}
      {modal?.type === 'toggle' && (
        <ConfirmModal
          danger={modal.user.active}
          message={`${modal.user.active ? 'Deactivate' : 'Activate'} user "${modal.user.fullName}"?`}
          onConfirm={() => handleToggle(modal.user)}
          onClose={() => setModal(null)}
        />
      )}
      {modal?.type === 'delete' && (
        <ConfirmModal
          message={`Permanently delete user "${modal.user.fullName}" (@${modal.user.username})? This cannot be undone.`}
          onConfirm={() => handleDelete(modal.user.id)}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
