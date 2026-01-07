'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Rig } from '@/lib/types/database';
import Link from 'next/link';

export default function NewEmployeePage() {
  const router = useRouter();
  const [rigs, setRigs] = useState<Rig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: '',
    cpf: '',
    email: '',
    phone: '',
    alternate_phone: '',
    address: '',
    dob: '',
    rig_id: '',
    role: 'employee',
  });

  useEffect(() => {
    async function fetchRigs() {
      const supabase = createClient();
      const { data } = await supabase.from('rigs').select('*').order('name');
      if (data) setRigs(data);
      setLoading(false);
    }
    fetchRigs();
  }, []);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.cpf.trim()) newErrors.cpf = 'CPF is required';
    if (!form.email.trim()) newErrors.email = 'Email is required';
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSaving(true);
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from('employees')
      .insert({
        name: form.name,
        cpf: form.cpf,
        email: form.email,
        phone: form.phone || null,
        alternate_phone: form.alternate_phone || null,
        address: form.address || null,
        dob: form.dob || null,
        rig_id: form.rig_id || null,
        role: form.role,
        clerk_user_id: `manual_${Date.now()}`, // Temporary - will be linked when user signs up
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating employee:', error);
      if (error.message.includes('cpf')) {
        setErrors({ cpf: 'This CPF is already registered' });
      }
      setSaving(false);
      return;
    }

    router.push(`/employees/${data.id}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '400px' }}>
        <div className="spinner" style={{ width: '2rem', height: '2rem' }} />
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center gap-4">
          <Link href="/employees" className="btn btn-secondary" style={{ padding: '0.5rem' }}>
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="page-title">Add New Employee</h1>
            <p className="text-muted text-sm">Create a new employee profile</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ maxWidth: '600px' }}>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label">Full Name *</label>
              <input
                type="text"
                className={`input ${errors.name ? 'input-error' : ''}`}
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Enter full name"
              />
              {errors.name && <span className="error-message">{errors.name}</span>}
            </div>

            <div className="input-group">
              <label className="input-label">CPF (Unique ID) *</label>
              <input
                type="text"
                className={`input ${errors.cpf ? 'input-error' : ''}`}
                value={form.cpf}
                onChange={e => setForm({ ...form, cpf: e.target.value })}
                placeholder="XXX.XXX.XXX-XX"
              />
              {errors.cpf && <span className="error-message">{errors.cpf}</span>}
            </div>

            <div className="input-group">
              <label className="input-label">Email *</label>
              <input
                type="email"
                className={`input ${errors.email ? 'input-error' : ''}`}
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="employee@example.com"
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label className="input-label">Phone</label>
                <input
                  type="tel"
                  className="input"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="+55 XX XXXXX-XXXX"
                />
              </div>
              <div className="input-group">
                <label className="input-label">Alternate Phone</label>
                <input
                  type="tel"
                  className="input"
                  value={form.alternate_phone}
                  onChange={e => setForm({ ...form, alternate_phone: e.target.value })}
                  placeholder="+55 XX XXXXX-XXXX"
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Date of Birth</label>
              <input
                type="date"
                className="input"
                value={form.dob}
                onChange={e => setForm({ ...form, dob: e.target.value })}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Address</label>
              <textarea
                className="input"
                rows={2}
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                placeholder="Full address"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label className="input-label">Rig</label>
                <select
                  className="input select"
                  value={form.rig_id}
                  onChange={e => setForm({ ...form, rig_id: e.target.value })}
                >
                  <option value="">Select Rig</option>
                  {rigs.map(rig => (
                    <option key={rig.id} value={rig.id}>{rig.name}</option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Role</label>
                <select
                  className="input select"
                  value={form.role}
                  onChange={e => setForm({ ...form, role: e.target.value })}
                >
                  <option value="employee">Employee</option>
                  <option value="rig_admin">Rig Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <Link href="/employees" className="btn btn-secondary">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner" /> : <Save size={18} />}
              Create Employee
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
