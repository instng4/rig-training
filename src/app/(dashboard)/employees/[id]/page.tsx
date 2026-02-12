'use client';

// Force dynamic rendering since this page uses auth
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/supabase/auth-context';
import { ArrowLeft, Edit2, Save, X, Trash2, Calendar, Plus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Avatar, AvatarUpload } from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import type { Employee, Rig, TrainingRecord, GracePeriodSetting, TrainingTypeConfig } from '@/lib/types/database';
import { enrichTrainingRecords } from '@/lib/utils/training-status';
import Link from 'next/link';

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [rigs, setRigs] = useState<Rig[]>([]);
  const [trainingRecords, setTrainingRecords] = useState<any[]>([]);
  const [trainingTypes, setTrainingTypes] = useState<TrainingTypeConfig[]>([]);
  const [graceSettings, setGraceSettings] = useState<GracePeriodSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Employee>>({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit training modal state
  const [showEditTrainingModal, setShowEditTrainingModal] = useState(false);
  const [editingTraining, setEditingTraining] = useState<any>(null);
  const [editTrainingForm, setEditTrainingForm] = useState({
    training_type: '',
    custom_training_name: '',
    completed_date: '',
    expiry_date: '',
  });
  const [savingEditTraining, setSavingEditTraining] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const employeeId = params.id as string;

      try {
        // Fetch rigs and training types
        const { data: rigsData } = await supabase.from('rigs').select('*').order('name');
        if (rigsData) setRigs(rigsData);

        const { data: typesData } = await supabase
          .from('training_types')
          .select('*')
          .eq('is_active', true)
          .order('name');
        if (typesData) setTrainingTypes(typesData);


        // Fetch grace settings
        const { data: graceData } = await supabase.from('grace_period_settings').select('*');
        if (graceData) setGraceSettings(graceData);

        // Fetch employee
        const { data: empData, error } = await supabase
          .from('employees')
          .select('*, rig:rigs(*)')
          .eq('id', employeeId)
          .single();

        if (error) {
          console.error('Error fetching employee:', error);
          return;
        }

        setEmployee(empData);
        setEditForm(empData);

        // Fetch training records
        const { data: trainingData } = await supabase
          .from('training_records')
          .select('*')
          .eq('employee_id', employeeId)
          .order('expiry_date', { ascending: true });

        if (trainingData && graceData) {
          const enriched = enrichTrainingRecords(trainingData, graceData);
          setTrainingRecords(enriched);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [params.id]);

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
      console.error('Error updating employee:', error);
    } else {
      setEmployee({ ...employee, ...editForm });
      setIsEditing(false);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!employee) return;
    
    const supabase = createClient();
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', employee.id);

    if (error) {
      console.error('Error deleting employee:', error);
    } else {
      router.push('/employees');
    }
  };

  const handlePhotoUpload = async (file: File) => {
    if (!employee) return;
    
    const supabase = createClient();
    const fileExt = file.name.split('.').pop();
    const fileName = `${employee.id}.${fileExt}`;
    
    const { error: uploadError, data } = await supabase.storage
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

  const handleEditTraining = async () => {
    if (!employee || !editingTraining || !editTrainingForm.training_type || !editTrainingForm.completed_date) return;

    setSavingEditTraining(true);
    const supabase = createClient();

    const trainingTypeName = editTrainingForm.training_type === 'Other' && editTrainingForm.custom_training_name
      ? editTrainingForm.custom_training_name
      : editTrainingForm.training_type;

    let expiryDate = editTrainingForm.expiry_date;
    if (!expiryDate) {
      const trainingType = trainingTypes.find(t => t.name === editTrainingForm.training_type);
      const validityMonths = trainingType?.default_validity_months || 12;
      const completed = new Date(editTrainingForm.completed_date);
      completed.setMonth(completed.getMonth() + validityMonths);
      expiryDate = completed.toISOString().split('T')[0];
    }

    const { error } = await supabase
      .from('training_records')
      .update({
        training_type: trainingTypeName,
        completed_date: editTrainingForm.completed_date,
        expiry_date: expiryDate,
      })
      .eq('id', editingTraining.id);

    if (error) {
      console.error('Error updating training:', error);
    } else {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '400px' }}>
        <div className="spinner" style={{ width: '2rem', height: '2rem' }} />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="card">
        <div className="empty-state">
          <div className="empty-state-title">Employee Not Found</div>
          <Link href="/employees" className="btn btn-primary">
            Back to Employees
          </Link>
        </div>
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
            <h1 className="page-title">{employee.name}</h1>
            <p className="text-muted text-sm">CPF: {employee.cpf}</p>
          </div>
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
            <>
              <button className="btn btn-secondary" onClick={() => setIsEditing(true)}>
                <Edit2 size={18} />
                Edit
              </button>
              <button className="btn btn-danger" onClick={() => setShowDeleteModal(true)}>
                <Trash2 size={18} />
                Delete
              </button>
            </>
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

            <div className="input-group">
              <label className="input-label">Role</label>
              <div className="text-sm" style={{ textTransform: 'capitalize' }}>
                {employee.role.replace('_', ' ')}
              </div>
            </div>
          </div>
        </div>

        {/* Training Records */}
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Training Records</h3>
            <Link href={`/training?employee=${employee.id}`} className="btn btn-primary btn-sm">
              Add Training
            </Link>
          </div>

          {trainingRecords.length === 0 ? (
            <div className="empty-state">
              <Calendar className="empty-state-icon" />
              <div className="empty-state-title">No Training Records</div>
              <p className="empty-state-description">
                This employee has no training records yet.
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
                        {record.days_until_expiry > 0 
                          ? `${record.days_until_expiry} days`
                          : `${Math.abs(record.days_until_expiry)} days ago`
                        }
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
                            setEditTrainingForm({
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

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Employee"
        message={`Are you sure you want to delete ${employee.name}? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
      />

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
              disabled={savingEditTraining || !editTrainingForm.training_type || !editTrainingForm.completed_date}
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
              value={editTrainingForm.training_type}
              onChange={e => setEditTrainingForm({ ...editTrainingForm, training_type: e.target.value })}
            >
              <option value="">Select Training Type</option>
              {trainingTypes.map(type => (
                <option key={type.id} value={type.name}>{type.name}</option>
              ))}
              <option value="Other">Other</option>
            </select>
          </div>

          {editTrainingForm.training_type === 'Other' && (
            <div className="input-group">
              <label className="input-label">Custom Training Name *</label>
              <input
                type="text"
                className="input"
                placeholder="Enter training name"
                value={editTrainingForm.custom_training_name}
                onChange={e => setEditTrainingForm({ ...editTrainingForm, custom_training_name: e.target.value })}
              />
            </div>
          )}

          <div className="input-group">
            <label className="input-label">Completed Date *</label>
            <input
              type="date"
              className="input"
              value={editTrainingForm.completed_date}
              onChange={e => setEditTrainingForm({ ...editTrainingForm, completed_date: e.target.value })}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Expiry Date (auto-calculated if empty)</label>
            <input
              type="date"
              className="input"
              value={editTrainingForm.expiry_date}
              onChange={e => setEditTrainingForm({ ...editTrainingForm, expiry_date: e.target.value })}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
