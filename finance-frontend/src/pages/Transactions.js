import React, { useState, useEffect, useCallback } from 'react';
import { transactionAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const fmtFull = (v) => `$${Number(v).toLocaleString('en-US', {minimumFractionDigits:2,maximumFractionDigits:2})}`;

const CATEGORIES = ['Salary','Rent','Groceries','Utilities','Freelance','Bonus','Dining','Transport',
  'Shopping','Healthcare','Investment','Travel','Entertainment','Education','Other'];

function TransactionModal({ tx, onClose, onSaved }) {
  const toast = useToast();
  const [form, setForm] = useState({
    amount: tx?.amount || '',
    type: tx?.type || 'INCOME',
    category: tx?.category || '',
    date: tx?.date || new Date().toISOString().split('T')[0],
    notes: tx?.notes || '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0) e.amount = 'Valid amount required';
    if (!form.category.trim()) e.category = 'Category required';
    if (!form.date) e.date = 'Date required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const payload = { ...form, amount: parseFloat(form.amount) };
      if (tx?.id) {
        await transactionAPI.update(tx.id, payload);
        toast.success('Transaction updated');
      } else {
        await transactionAPI.create(payload);
        toast.success('Transaction created');
      }
      onSaved();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setLoading(false);
    }
  };

  const set = (k, v) => { setForm(f => ({...f, [k]: v})); setErrors(e => ({...e, [k]: undefined})); };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{tx?.id ? 'Edit Transaction' : 'New Transaction'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Amount</label>
                <input className="form-input" type="number" step="0.01" min="0.01" placeholder="0.00"
                  value={form.amount} onChange={e => set('amount', e.target.value)}/>
                {errors.amount && <div className="form-error">{errors.amount}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Type</label>
                <select className="form-select" value={form.type} onChange={e => set('type', e.target.value)}>
                  <option value="INCOME">INCOME</option>
                  <option value="EXPENSE">EXPENSE</option>
                </select>
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Category</label>
                <input className="form-input" list="cats" placeholder="e.g. Salary"
                  value={form.category} onChange={e => set('category', e.target.value)}/>
                <datalist id="cats">{CATEGORIES.map(c => <option key={c} value={c}/>)}</datalist>
                {errors.category && <div className="form-error">{errors.category}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input className="form-input" type="date" value={form.date} onChange={e => set('date', e.target.value)}/>
                {errors.date && <div className="form-error">{errors.date}</div>}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Notes (optional)</label>
              <textarea className="form-textarea" placeholder="Add a note..." maxLength={500}
                value={form.notes} onChange={e => set('notes', e.target.value)}/>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : tx?.id ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ConfirmModal({ message, onConfirm, onClose }) {
  const [loading, setLoading] = useState(false);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{maxWidth:380}} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">Confirm Delete</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p className="confirm-text">{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-danger" disabled={loading} onClick={async () => {
            setLoading(true); await onConfirm(); setLoading(false);
          }}>{loading ? 'Deleting...' : 'Delete'}</button>
        </div>
      </div>
    </div>
  );
}

export default function Transactions() {
  const { isAnalyst, isAdmin } = useAuth();
  const toast = useToast();

  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({ type: '', category: '', from: '', to: '', sortBy: 'date', sortDir: 'desc' });
  const [modal, setModal] = useState(null); // null | { type: 'create'|'edit'|'delete', tx? }

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, size: 15, ...filters };
      Object.keys(params).forEach(k => !params[k] && delete params[k]);
      const res = await transactionAPI.getAll(params);
      setData(res.data.data);
    } catch { toast.error('Failed to load transactions'); }
    finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    try {
      await transactionAPI.delete(id);
      toast.success('Transaction deleted');
      setModal(null);
      load();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Delete failed');
    }
  };

  const setFilter = (k, v) => { setFilters(f => ({...f, [k]: v})); setPage(0); };

  return (
    <div className="main-content">
      <div className="page-header">
        <div>
          <h2 className="page-title">Transactions</h2>
          <p className="page-subtitle">{data.totalElements} records total</p>
        </div>
        {isAnalyst && (
          <button className="btn btn-primary" onClick={() => setModal({ type: 'create' })}>
            + New Transaction
          </button>
        )}
      </div>

      <div className="page-body">
        {/* Filters */}
        <div className="filters-bar">
          <select className="filter-input" value={filters.type} onChange={e => setFilter('type', e.target.value)}>
            <option value="">All Types</option>
            <option value="INCOME">Income</option>
            <option value="EXPENSE">Expense</option>
          </select>
          <input className="filter-input" placeholder="Category..." value={filters.category}
            onChange={e => setFilter('category', e.target.value)} style={{width:140}}/>
          <input className="filter-input" type="date" value={filters.from} title="From date"
            onChange={e => setFilter('from', e.target.value)}/>
          <input className="filter-input" type="date" value={filters.to} title="To date"
            onChange={e => setFilter('to', e.target.value)}/>
          <select className="filter-input" value={filters.sortBy} onChange={e => setFilter('sortBy', e.target.value)}>
            <option value="date">Sort: Date</option>
            <option value="amount">Sort: Amount</option>
            <option value="category">Sort: Category</option>
          </select>
          <select className="filter-input" value={filters.sortDir} onChange={e => setFilter('sortDir', e.target.value)}>
            <option value="desc">↓ Desc</option>
            <option value="asc">↑ Asc</option>
          </select>
          {(filters.type || filters.category || filters.from || filters.to) && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setFilters({type:'',category:'',from:'',to:'',sortBy:'date',sortDir:'desc'}); setPage(0); }}>
              Clear
            </button>
          )}
        </div>

        <div className="card">
          {loading ? (
            <div className="loader"><div className="spinner"/> Loading...</div>
          ) : data.content.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">⇄</div>
              <p>No transactions found</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Category</th>
                    <th>Amount</th>
                    <th>Notes</th>
                    <th>Created By</th>
                    {isAnalyst && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {data.content.map(tx => (
                    <tr key={tx.id}>
                      <td style={{fontFamily:'var(--font-mono)',color:'var(--text-dim)',fontSize:'0.8rem'}}>#{tx.id}</td>
                      <td style={{fontFamily:'var(--font-mono)',fontSize:'0.8rem',color:'var(--text-muted)'}}>{tx.date}</td>
                      <td><span className={`badge badge-${tx.type.toLowerCase()}`}>{tx.type}</span></td>
                      <td style={{fontWeight:500}}>{tx.category}</td>
                      <td className={`amount-${tx.type.toLowerCase()}`} style={{fontFamily:'var(--font-mono)',fontWeight:600}}>
                        {tx.type === 'INCOME' ? '+' : '-'}{fmtFull(tx.amount)}
                      </td>
                      <td style={{color:'var(--text-muted)',fontSize:'0.85rem',maxWidth:200,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                        {tx.notes || '—'}
                      </td>
                      <td style={{color:'var(--text-muted)',fontSize:'0.8rem',fontFamily:'var(--font-mono)'}}>{tx.createdBy}</td>
                      {isAnalyst && (
                        <td>
                          <div style={{display:'flex',gap:6}}>
                            <button className="btn btn-ghost btn-sm" onClick={() => setModal({type:'edit',tx})}>Edit</button>
                            {isAdmin && (
                              <button className="btn btn-danger btn-sm" onClick={() => setModal({type:'delete',tx})}>Del</button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {data.totalPages > 1 && (
            <div className="pagination">
              <span>Page {page + 1} of {data.totalPages}</span>
              <div className="page-btns">
                <button className="page-btn" disabled={page === 0} onClick={() => setPage(0)}>«</button>
                <button className="page-btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}>‹</button>
                {Array.from({length: Math.min(data.totalPages, 7)}, (_, i) => {
                  const p = Math.max(0, Math.min(page - 3, data.totalPages - 7)) + i;
                  return (
                    <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => setPage(p)}>
                      {p + 1}
                    </button>
                  );
                })}
                <button className="page-btn" disabled={page >= data.totalPages - 1} onClick={() => setPage(p => p + 1)}>›</button>
                <button className="page-btn" disabled={page >= data.totalPages - 1} onClick={() => setPage(data.totalPages - 1)}>»</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {modal?.type === 'create' && (
        <TransactionModal onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }}/>
      )}
      {modal?.type === 'edit' && (
        <TransactionModal tx={modal.tx} onClose={() => setModal(null)} onSaved={() => { setModal(null); load(); }}/>
      )}
      {modal?.type === 'delete' && (
        <ConfirmModal
          message={`Delete transaction #${modal.tx.id} (${modal.tx.category} — ${fmtFull(modal.tx.amount)})?`}
          onConfirm={() => handleDelete(modal.tx.id)}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
