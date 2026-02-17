'use client';

// Force dynamic rendering since this page uses auth
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/supabase/auth-context';
import { createClient } from '@/lib/supabase/client';
import { Save, Edit2, X, Plus, GraduationCap, User, UserPlus, Calendar } from 'lucide-react';
import { generateDutyPreview } from '@/lib/utils/duty-utils';
import { Avatar, AvatarUpload } from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import type { Employee, Rig, TrainingTypeConfig, GracePeriodSetting, DutyPattern } from '@/lib/types/database';
import { enrichTrainingRecords } from '@/lib/utils/training-status';

export default function MyDashboardPage() {
  const router = useRouter();
  const { user, userMetadata, loading: authLoading } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [rigs, setRigs] = useState<Rig[]>([]);
  const [trainingTypes, setTrainingTypes] = useState<TrainingTypeConfig[]>([]);
  const [trainingRecords, setTrainingRecords] = useState<any[]>([]);
  const [graceSettings, setGraceSettings] = useState<GracePeriodSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Employee>>({});
  const [saving, setSaving] = useState(false);

  // New profile creation state
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [newProfile, setNewProfile] = useState({
    name: '',
    cpf: '',
    email: '',
    phone: '',
    alternate_phone: '',
    address: '',
    dob: '',
    rig_id: '',
  });
  const [creatingProfile, setCreatingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');

  // Training modal state
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [newTraining, setNewTraining] = useState({
    training_type: '',
    custom_training_name: '',
    completed_date: '',
    expiry_date: '',
  });
  const [savingTraining, setSavingTraining] = useState(false);

  // Edit training modal state
  const [showEditTrainingModal, setShowEditTrainingModal] = useState(false);
  const [editingTraining, setEditingTraining] = useState<any>(null);
  const [editTraining, setEditTraining] = useState({
    training_type: '',
    custom_training_name: '',
    completed_date: '',
    expiry_date: '',
  });
  const [savingEditTraining, setSavingEditTraining] = useState(false);

  // Duty pattern state
  const [dutyStartDate, setDutyStartDate] = useState('');
  const [savingDuty, setSavingDuty] = useState(false);
  const [dutyPreview, setDutyPreview] = useState<{ start: string; end: string; type: 'on' | 'off' }[]>([]);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;

      const supabase = createClient();

      try {
        // Fetch rigs
        const { data: rigsData } = await supabase.from('rigs').select('*').order('name');
        if (rigsData) setRigs(rigsData);

        // Fetch training types
        const { data: typesData } = await supabase
          .from('training_types')
          .select('*')
          .eq('is_active', true)
          .order('name');
        if (typesData) setTrainingTypes(typesData);

        // Fetch grace settings
        const { data: graceData } = await supabase.from('grace_period_settings').select('*');
        if (graceData) setGraceSettings(graceData);

        // Fetch employee profile (clerk_user_id stores Supabase Auth user ID after migration)
        const { data: empData, error } = await supabase
          .from('employees')
          .select('*, rig:rigs(*)')
          .eq('clerk_user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching employee:', error);
          // Employee record doesn't exist - show create profile form
          setEmployee(null);
          setIsCreatingProfile(true);
          // Pre-fill email from auth
          setNewProfile(prev => ({ ...prev, email: user.email || '' }));
        } else {
          setEmployee(empData);
          setEditForm(empData);

          // Load existing duty pattern
          if (empData.duty_pattern?.start_date) {
            setDutyStartDate(empData.duty_pattern.start_date);
            setDutyPreview(generateDutyPreview(empData.duty_pattern.start_date, 3));
          }

          // Fetch training records
          const { data: trainingData } = await supabase
            .from('training_records')
            .select('*')
            .eq('employee_id', empData.id)
            .order('expiry_date', { ascending: true });

          if (trainingData && graceData) {
            const enriched = enrichTrainingRecords(trainingData, graceData);
            setTrainingRecords(enriched);
          }
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      fetchData();
    }
  }, [user, authLoading]);

  // Handle creating a new profile
  const handleCreateProfile = async () => {
    if (!user || !newProfile.name || !newProfile.cpf || !newProfile.email || !newProfile.rig_id) {
      setProfileError('Please fill in all required fields (Name, CPF, Email, Rig)');
      return;
    }

    setCreatingProfile(true);
    setProfileError('');

    const supabase = createClient();

    const { data: newEmployee, error } = await supabase
      .from('employees')
      .insert({
        clerk_user_id: user.id,
        name: newProfile.name,
        cpf: newProfile.cpf,
        email: newProfile.email,
        phone: newProfile.phone || null,
        alternate_phone: newProfile.alternate_phone || null,
        address: newProfile.address || null,
        dob: newProfile.dob || null,
        rig_id: newProfile.rig_id,
        role: 'employee', // New users are always employees
      })
      .select('*, rig:rigs(*)')
      .single();

    if (error) {
      console.error('Error creating profile:', error);
      if (error.code === '23505') {
        setProfileError('A profile with this CPF already exists.');
      } else {
        setProfileError('Failed to create profile. Please try again.');
      }
    } else {
      setEmployee(newEmployee);
      setEditForm(newEmployee);
      setIsCreatingProfile(false);
    }

    setCreatingProfile(false);
  };

  const handleSave = async () => {
    if (!employee) return;
    setSaving(true);

    const supabase = createClient();
    const { error } = await supabase
      .from('employees')
      .update({
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        alternate_phone: editForm.alternate_phone,
        address: editForm.address,
        dob: editForm.dob,
        rig_id: editForm.rig_id,
      })
      .eq('id', employee.id);

    if (error) {
      console.error('Error updating profile:', error);
    } else {
      setEmployee({ ...employee, ...editForm });
      setIsEditing(false);
    }
    setSaving(false);
  };

  const handlePhotoUpload = async (file: File) => {
    if (!employee) return;

    const supabase = createClient();
    const fileExt = file.name.split('.').pop();
    const fileName = `${employee.id}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    await supabase
      .from('employees')
      .update({ photo_url: publicUrl })
      .eq('id', employee.id);

    setEmployee({ ...employee, photo_url: publicUrl });
  };

  const handleAddTraining = async () => {
    if (!employee || !newTraining.training_type || !newTraining.completed_date) return;

    setSavingTraining(true);
    const supabase = createClient();

    // Use custom name for "Other" type, otherwise use selected type
    const trainingTypeName = newTraining.training_type === 'Other' && newTraining.custom_training_name
      ? newTraining.custom_training_name
      : newTraining.training_type;

    // Calculate expiry date based on training type validity
    let expiryDate = newTraining.expiry_date;
    if (!expiryDate) {
      const trainingType = trainingTypes.find(t => t.name === newTraining.training_type);
      const validityMonths = trainingType?.default_validity_months || 12;
      const completed = new Date(newTraining.completed_date);
      completed.setMonth(completed.getMonth() + validityMonths);
      expiryDate = completed.toISOString().split('T')[0];
    }

    const { error } = await supabase.from('training_records').insert({
      employee_id: employee.id,
      training_type: trainingTypeName,
      completed_date: newTraining.completed_date,
      expiry_date: expiryDate,
      status: 'SAFE',
    });

    if (error) {
      console.error('Error adding training:', error);
    } else {
      // Refresh training records
      const { data: trainingData } = await supabase
        .from('training_records')
        .select('*')
        .eq('employee_id', employee.id)
        .order('expiry_date', { ascending: true });

      if (trainingData && graceSettings) {
        const enriched = enrichTrainingRecords(trainingData, graceSettings);
        setTrainingRecords(enriched);
      }

      setShowTrainingModal(false);
      setNewTraining({ training_type: '', custom_training_name: '', completed_date: '', expiry_date: '' });
    }
    setSavingTraining(false);
  };

  const handleEditTraining = async () => {
    if (!employee || !editingTraining || !editTraining.training_type || !editTraining.completed_date) return;

    setSavingEditTraining(true);
    const supabase = createClient();

    // Use custom name for "Other" type, otherwise use selected type
    const trainingTypeName = editTraining.training_type === 'Other' && editTraining.custom_training_name
      ? editTraining.custom_training_name
      : editTraining.training_type;

    // Calculate expiry date based on training type validity if not provided
    let expiryDate = editTraining.expiry_date;
    if (!expiryDate) {
      const trainingType = trainingTypes.find(t => t.name === editTraining.training_type);
      const validityMonths = trainingType?.default_validity_months || 12;
      const completed = new Date(editTraining.completed_date);
      completed.setMonth(completed.getMonth() + validityMonths);
      expiryDate = completed.toISOString().split('T')[0];
    }

    const { error } = await supabase
      .from('training_records')
      .update({
        training_type: trainingTypeName,
        completed_date: editTraining.completed_date,
        expiry_date: expiryDate,
      })
      .eq('id', editingTraining.id);

    if (error) {
      console.error('Error updating training:', error);
    } else {
      // Refresh training records
      const { data: trainingData } = await supabase
        .from('training_records')
        .select('*')
        .eq('employee_id', employee.id)
        .order('expiry_date', { ascending: true });

      if (trainingData && graceSettings) {
        const enriched = enrichTrainingRecords(trainingData, graceSettings);
        setTrainingRecords(enriched);
      }

      setShowEditTrainingModal(false);
      setEditingTraining(null);
    }
    setSavingEditTraining(false);
  };

  const handleSaveDutyPattern = async () => {
    if (!employee || !dutyStartDate) return;
    setSavingDuty(true);

    const dutyPattern: DutyPattern = {
      start_date: dutyStartDate,
      on_duty_days: 14,
      off_duty_days: 14,
    };

    const supabase = createClient();
    const { error } = await supabase
      .from('employees')
      .update({ duty_pattern: dutyPattern })
      .eq('id', employee.id);

    if (error) {
      console.error('Error saving duty pattern:', error);
    } else {
      setEmployee({ ...employee, duty_pattern: dutyPattern });
      setDutyPreview(generateDutyPreview(dutyStartDate, 3));
    }
    setSavingDuty(false);
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '400px' }}>
        <div className="spinner" style={{ width: '2rem', height: '2rem' }} />
      </div>
    );
  }

  // Show profile creation form for new users
  if (!employee && isCreatingProfile) {
    return (
      <div>
        <div className="page-header">
          <div>
            <h1 className="page-title">Create Your Profile</h1>
            <p className="text-muted text-sm">
              Complete your profile to access the training management system
            </p>
          </div>
        </div>

        <div className="card" style={{ maxWidth: '600px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {profileError && (
              <div style={{ 
                padding: '0.75rem', 
                background: 'var(--status-overdue-bg)', 
                color: 'var(--status-overdue)', 
                borderRadius: 'var(--radius)',
                fontSize: '0.875rem'
              }}>
                {profileError}
              </div>
            )}

            <div className="input-group">
              <label className="input-label">Full Name *</label>
              <input
                type="text"
                className="input"
                placeholder="Enter your full name"
                value={newProfile.name}
                onChange={e => setNewProfile({ ...newProfile, name: e.target.value })}
              />
            </div>

            <div className="input-group">
              <label className="input-label">CPF *</label>
              <input
                type="text"
                className="input"
                placeholder="XXX.XXX.XXX-XX"
                value={newProfile.cpf}
                onChange={e => setNewProfile({ ...newProfile, cpf: e.target.value })}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Email *</label>
              <input
                type="email"
                className="input"
                value={newProfile.email}
                onChange={e => setNewProfile({ ...newProfile, email: e.target.value })}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Rig Assignment *</label>
              <select
                className="input select"
                value={newProfile.rig_id}
                onChange={e => setNewProfile({ ...newProfile, rig_id: e.target.value })}
              >
                <option value="">Select your rig</option>
                {rigs.map(rig => (
                  <option key={rig.id} value={rig.id}>{rig.name}</option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Phone</label>
              <input
                type="tel"
                className="input"
                placeholder="Phone number"
                value={newProfile.phone}
                onChange={e => setNewProfile({ ...newProfile, phone: e.target.value })}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Alternate Phone</label>
              <input
                type="tel"
                className="input"
                placeholder="Alternate phone number"
                value={newProfile.alternate_phone}
                onChange={e => setNewProfile({ ...newProfile, alternate_phone: e.target.value })}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Date of Birth</label>
              <input
                type="date"
                className="input"
                value={newProfile.dob}
                onChange={e => setNewProfile({ ...newProfile, dob: e.target.value })}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Address</label>
              <textarea
                className="input"
                rows={2}
                placeholder="Your address"
                value={newProfile.address}
                onChange={e => setNewProfile({ ...newProfile, address: e.target.value })}
              />
            </div>

            <button
              className="btn btn-primary"
              onClick={handleCreateProfile}
              disabled={creatingProfile || !newProfile.name || !newProfile.cpf || !newProfile.email || !newProfile.rig_id}
              style={{ marginTop: '0.5rem' }}
            >
              {creatingProfile ? <span className="spinner" /> : <UserPlus size={18} />}
              Create Profile
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Guard against null employee (shouldn't happen but TypeScript needs this)
  if (!employee) {
    return null;
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">My Dashboard</h1>
          <p className="text-muted text-sm">
            Manage your profile and training records
          </p>
        </div>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setIsEditing(false);
                  setEditForm(employee);
                }}
              >
                <X size={18} />
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? <span className="spinner" /> : <Save size={18} />}
                Save Changes
              </button>
            </>
          ) : (
            <button className="btn btn-primary" onClick={() => setIsEditing(true)}>
              <Edit2 size={18} />
              Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Duty Pattern Section */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div className="card-header">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calendar size={18} />
            Duty Pattern (14/14 Rotation)
          </h3>
        </div>

        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
          {/* Date Picker */}
          <div style={{ flex: '0 0 auto' }}>
            <div className="input-group" style={{ marginBottom: '1rem' }}>
              <label className="input-label">First On-Duty Start Date</label>
              <p className="text-xs text-muted" style={{ marginBottom: '0.5rem' }}>Select the first day of your 14-day on-duty period</p>
              <input
                type="date"
                className="input"
                value={dutyStartDate}
                min={(() => {
                  const now = new Date();
                  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
                })()}
                max={(() => {
                  const now = new Date();
                  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0);
                  return nextMonth.toISOString().split('T')[0];
                })()}
                onChange={e => {
                  setDutyStartDate(e.target.value);
                  if (e.target.value) {
                    setDutyPreview(generateDutyPreview(e.target.value, 3));
                  } else {
                    setDutyPreview([]);
                  }
                }}
              />
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleSaveDutyPattern}
              disabled={savingDuty || !dutyStartDate}
            >
              {savingDuty ? <span className="spinner" /> : <Save size={16} />}
              Save Duty Pattern
            </button>
            {employee.duty_pattern?.start_date && (
              <div className="text-xs text-muted" style={{ marginTop: '0.5rem' }}>
                Current pattern starts: {new Date(employee.duty_pattern.start_date + 'T00:00:00').toLocaleDateString()}
              </div>
            )}
          </div>

          {/* Preview */}
          {dutyPreview.length > 0 && (
            <div style={{ flex: 1, minWidth: '280px' }}>
              <label className="input-label" style={{ marginBottom: '0.5rem' }}>Upcoming Rotation Preview</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                {dutyPreview.map((block, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius)',
                      background: block.type === 'on' ? 'var(--status-safe-bg)' : 'var(--muted-bg)',
                      border: `1px solid ${block.type === 'on' ? 'var(--status-safe)' : 'var(--border)'}`,
                      fontSize: '0.8125rem',
                    }}
                  >
                    <span style={{
                      display: 'inline-block',
                      padding: '0.125rem 0.5rem',
                      borderRadius: '999px',
                      fontSize: '0.6875rem',
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      background: block.type === 'on' ? 'var(--status-safe)' : 'var(--text-muted)',
                      color: '#fff',
                      minWidth: '36px',
                      textAlign: 'center',
                    }}>
                      {block.type === 'on' ? 'ON' : 'OFF'}
                    </span>
                    <span>
                      {new Date(block.start + 'T00:00:00').toLocaleDateString()} — {new Date(block.end + 'T00:00:00').toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '1.5rem' }}>
        {/* Profile Card */}
        <div className="card">
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            {isEditing ? (
              <AvatarUpload
                currentPhotoUrl={employee.photo_url}
                name={employee.name}
                onUpload={handlePhotoUpload}
                size="lg"
              />
            ) : (
              <Avatar photoUrl={employee.photo_url} name={employee.name} size="lg" />
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="input-group">
              <label className="input-label">Name</label>
              {isEditing ? (
                <input
                  type="text"
                  className="input"
                  value={editForm.name || ''}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                />
              ) : (
                <div className="text-sm">{employee.name}</div>
              )}
            </div>

            <div className="input-group">
              <label className="input-label">CPF</label>
              <div className="text-sm text-muted">{employee.cpf}</div>
            </div>

            <div className="input-group">
              <label className="input-label">Email</label>
              {isEditing ? (
                <input
                  type="email"
                  className="input"
                  value={editForm.email || ''}
                  onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                />
              ) : (
                <div className="text-sm">{employee.email}</div>
              )}
            </div>

            <div className="input-group">
              <label className="input-label">Phone</label>
              {isEditing ? (
                <input
                  type="tel"
                  className="input"
                  value={editForm.phone || ''}
                  onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                />
              ) : (
                <div className="text-sm">{employee.phone || '-'}</div>
              )}
            </div>

            <div className="input-group">
              <label className="input-label">Alternate Phone</label>
              {isEditing ? (
                <input
                  type="tel"
                  className="input"
                  value={editForm.alternate_phone || ''}
                  onChange={e => setEditForm({ ...editForm, alternate_phone: e.target.value })}
                />
              ) : (
                <div className="text-sm">{employee.alternate_phone || '-'}</div>
              )}
            </div>

            <div className="input-group">
              <label className="input-label">Date of Birth</label>
              {isEditing ? (
                <input
                  type="date"
                  className="input"
                  value={editForm.dob || ''}
                  onChange={e => setEditForm({ ...editForm, dob: e.target.value })}
                />
              ) : (
                <div className="text-sm">
                  {employee.dob ? new Date(employee.dob).toLocaleDateString() : '-'}
                </div>
              )}
            </div>

            <div className="input-group">
              <label className="input-label">Address</label>
              {isEditing ? (
                <textarea
                  className="input"
                  rows={2}
                  value={editForm.address || ''}
                  onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                />
              ) : (
                <div className="text-sm">{employee.address || '-'}</div>
              )}
            </div>

            <div className="input-group">
              <label className="input-label">Rig</label>
              {isEditing ? (
                <select
                  className="input select"
                  value={editForm.rig_id || ''}
                  onChange={e => setEditForm({ ...editForm, rig_id: e.target.value })}
                >
                  <option value="">Select Rig</option>
                  {rigs.map(rig => (
                    <option key={rig.id} value={rig.id}>{rig.name}</option>
                  ))}
                </select>
              ) : (
                <div className="text-sm">{(employee.rig as any)?.name || '-'}</div>
              )}
            </div>
          </div>
        </div>

        {/* Training Records Card */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>My Training Records</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setShowTrainingModal(true)}>
              <Plus size={16} />
              Add Training
            </button>
          </div>

          {trainingRecords.length === 0 ? (
            <div className="empty-state">
              <GraduationCap className="empty-state-icon" />
              <div className="empty-state-title">No Training Records</div>
              <p className="empty-state-description">
                You haven't added any training records yet. Click the button above to add your training history.
              </p>
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Training Type</th>
                    <th>Completed</th>
                    <th>Expires</th>
                    <th>Days Left</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {trainingRecords.map(record => (
                    <tr key={record.id}>
                      <td className="font-medium">{record.training_type}</td>
                      <td>{new Date(record.completed_date).toLocaleDateString()}</td>
                      <td>{new Date(record.expiry_date).toLocaleDateString()}</td>
                      <td>
                        <span style={{
                          color: record.days_until_expiry < 0 ? 'var(--status-overdue)' : 'inherit'
                        }}>
                          {record.days_until_expiry > 0
                            ? `${record.days_until_expiry} days`
                            : record.days_until_expiry === 0
                            ? 'Today'
                            : `${Math.abs(record.days_until_expiry)} days ago`
                          }
                        </span>
                      </td>
                      <td>
                        <StatusBadge status={record.calculated_status} size="sm" />
                      </td>
                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.25rem 0.5rem' }}
                          onClick={() => {
                            setEditingTraining(record);
                            const isKnownType = trainingTypes.some(t => t.name === record.training_type);
                            setEditTraining({
                              training_type: isKnownType ? record.training_type : 'Other',
                              custom_training_name: isKnownType ? '' : record.training_type,
                              completed_date: record.completed_date,
                              expiry_date: record.expiry_date,
                            });
                            setShowEditTrainingModal(true);
                          }}
                        >
                          <Edit2 size={14} />
                          Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Training Modal */}
      <Modal
        isOpen={showTrainingModal}
        onClose={() => setShowTrainingModal(false)}
        title="Add Training Record"
        size="md"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowTrainingModal(false)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleAddTraining}
              disabled={savingTraining || !newTraining.training_type || !newTraining.completed_date}
            >
              {savingTraining && <span className="spinner" />}
              Add Training
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="input-group">
            <label className="input-label">Training Type *</label>
            <select
              className="input select"
              value={newTraining.training_type}
              onChange={e => setNewTraining({ ...newTraining, training_type: e.target.value })}
            >
              <option value="">Select Training Type</option>
              {trainingTypes.map(type => (
                <option key={type.id} value={type.name}>{type.name}</option>
              ))}
              <option value="Other">Other</option>
            </select>
          </div>

          {newTraining.training_type === 'Other' && (
            <div className="input-group">
              <label className="input-label">Custom Training Name *</label>
              <input
                type="text"
                className="input"
                placeholder="Enter training name"
                value={newTraining.custom_training_name}
                onChange={e => setNewTraining({ ...newTraining, custom_training_name: e.target.value })}
              />
            </div>
          )}

          <div className="input-group">
            <label className="input-label">Completed Date *</label>
            <input
              type="date"
              className="input"
              value={newTraining.completed_date}
              onChange={e => setNewTraining({ ...newTraining, completed_date: e.target.value })}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Expiry Date (auto-calculated if empty)</label>
            <input
              type="date"
              className="input"
              value={newTraining.expiry_date}
              onChange={e => setNewTraining({ ...newTraining, expiry_date: e.target.value })}
            />
          </div>
        </div>
      </Modal>

      {/* Edit Training Modal */}
      <Modal
        isOpen={showEditTrainingModal}
        onClose={() => {
          setShowEditTrainingModal(false);
          setEditingTraining(null);
        }}
        title="Edit Training Record"
        size="md"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => {
              setShowEditTrainingModal(false);
              setEditingTraining(null);
            }}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleEditTraining}
              disabled={savingEditTraining || !editTraining.training_type || !editTraining.completed_date}
            >
              {savingEditTraining && <span className="spinner" />}
              Save Changes
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="input-group">
            <label className="input-label">Training Type *</label>
            <select
              className="input select"
              value={editTraining.training_type}
              onChange={e => setEditTraining({ ...editTraining, training_type: e.target.value })}
            >
              <option value="">Select Training Type</option>
              {trainingTypes.map(type => (
                <option key={type.id} value={type.name}>{type.name}</option>
              ))}
              <option value="Other">Other</option>
            </select>
          </div>

          {editTraining.training_type === 'Other' && (
            <div className="input-group">
              <label className="input-label">Custom Training Name *</label>
              <input
                type="text"
                className="input"
                placeholder="Enter training name"
                value={editTraining.custom_training_name}
                onChange={e => setEditTraining({ ...editTraining, custom_training_name: e.target.value })}
              />
            </div>
          )}

          <div className="input-group">
            <label className="input-label">Completed Date *</label>
            <input
              type="date"
              className="input"
              value={editTraining.completed_date}
              onChange={e => setEditTraining({ ...editTraining, completed_date: e.target.value })}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Expiry Date (auto-calculated if empty)</label>
            <input
              type="date"
              className="input"
              value={editTraining.expiry_date}
              onChange={e => setEditTraining({ ...editTraining, expiry_date: e.target.value })}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
