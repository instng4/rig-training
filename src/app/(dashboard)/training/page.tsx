'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Plus, Filter, GraduationCap, Edit2, MapPin, Mail } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import type { Employee, TrainingRecord, Rig, TrainingTypeConfig, GracePeriodSetting, TrainingSchedule } from '@/lib/types/database';
import { enrichTrainingRecords } from '@/lib/utils/training-status';
import { categorizeDateRange } from '@/lib/utils/duty-utils';

export default function TrainingPage() {
  const searchParams = useSearchParams();
  const preselectedEmployee = searchParams.get('employee');
  
  const [records, setRecords] = useState<any[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [trainingTypes, setTrainingTypes] = useState<TrainingTypeConfig[]>([]);
  const [rigs, setRigs] = useState<Rig[]>([]);
  const [graceSettings, setGraceSettings] = useState<GracePeriodSetting[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRig, setSelectedRig] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  
  // Modal
  const [showAddModal, setShowAddModal] = useState(!!preselectedEmployee);
  const [newRecord, setNewRecord] = useState({
    employee_id: preselectedEmployee || '',
    training_type: '',
    completed_date: '',
    expiry_date: '',
  });
  const [saving, setSaving] = useState(false);

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [editRecord, setEditRecord] = useState({
    training_type: '',
    completed_date: '',
    expiry_date: '',
  });
  const [savingEdit, setSavingEdit] = useState(false);

  // Search available training modal state
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchModalRecord, setSearchModalRecord] = useState<any>(null);
  const [searchSchedules, setSearchSchedules] = useState<(TrainingSchedule & { dutyStatus: string })[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [emailSending, setEmailSending] = useState<Record<string, boolean>>({});
  const [emailStatus, setEmailStatus] = useState<Record<string, { success: boolean; message: string }>>({});

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const supabase = createClient();
    
    try {
      // Fetch all reference data
      const [rigsRes, typesRes, graceRes, employeesRes] = await Promise.all([
        supabase.from('rigs').select('*').order('name'),
        supabase.from('training_types').select('*').eq('is_active', true).order('name'),
        supabase.from('grace_period_settings').select('*'),
        supabase.from('employees').select('*, rig:rigs(*)').order('name'),
      ]);

      if (rigsRes.data) setRigs(rigsRes.data);
      if (typesRes.data) setTrainingTypes(typesRes.data);
      if (graceRes.data) setGraceSettings(graceRes.data);
      if (employeesRes.data) setEmployees(employeesRes.data);

      // Fetch training records
      const { data: recordsData } = await supabase
        .from('training_records')
        .select('*, employees(id, name, cpf, rig_id, rig:rigs(*))')
        .order('expiry_date', { ascending: true });

      if (recordsData && graceRes.data) {
        const enriched = enrichTrainingRecords(recordsData, graceRes.data);
        const withEmployee = enriched.map(r => ({
          ...r,
          employee: (r as any).employees,
        }));
        setRecords(withEmployee);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleAddRecord = async () => {
    if (!newRecord.employee_id || !newRecord.training_type || !newRecord.completed_date) {
      return;
    }

    setSaving(true);
    const supabase = createClient();

    // Calculate expiry date based on training type validity
    let expiryDate = newRecord.expiry_date;
    if (!expiryDate) {
      const trainingType = trainingTypes.find(t => t.name === newRecord.training_type);
      const validityMonths = trainingType?.default_validity_months || 12;
      const completed = new Date(newRecord.completed_date);
      completed.setMonth(completed.getMonth() + validityMonths);
      expiryDate = completed.toISOString().split('T')[0];
    }

    const { error } = await supabase.from('training_records').insert({
      employee_id: newRecord.employee_id,
      training_type: newRecord.training_type,
      completed_date: newRecord.completed_date,
      expiry_date: expiryDate,
      status: 'SAFE',
    });

    if (error) {
      console.error('Error adding record:', error);
    } else {
      setShowAddModal(false);
      setNewRecord({ employee_id: '', training_type: '', completed_date: '', expiry_date: '' });
      fetchData();
    }
    setSaving(false);
  };

  const handleEditRecord = async () => {
    if (!editingRecord || !editRecord.training_type || !editRecord.completed_date) return;

    setSavingEdit(true);
    const supabase = createClient();

    let expiryDate = editRecord.expiry_date;
    if (!expiryDate) {
      const trainingType = trainingTypes.find(t => t.name === editRecord.training_type);
      const validityMonths = trainingType?.default_validity_months || 12;
      const completed = new Date(editRecord.completed_date);
      completed.setMonth(completed.getMonth() + validityMonths);
      expiryDate = completed.toISOString().split('T')[0];
    }

    const { error } = await supabase
      .from('training_records')
      .update({
        training_type: editRecord.training_type,
        completed_date: editRecord.completed_date,
        expiry_date: expiryDate,
      })
      .eq('id', editingRecord.id);

    if (error) {
      console.error('Error updating record:', error);
    } else {
      setShowEditModal(false);
      setEditingRecord(null);
      fetchData();
    }
    setSavingEdit(false);
  };

  const handleSearchTraining = async (record: any) => {
    setSearchModalRecord(record);
    setShowSearchModal(true);
    setSearchLoading(true);
    setSearchSchedules([]);
    setEmailStatus({});

    const supabase = createClient();
    const today = new Date().toISOString().split('T')[0];

    const { data: schedulesData } = await supabase
      .from('training_schedules')
      .select('*')
      .eq('training_type', record.training_type)
      .gte('start_date', today)
      .order('start_date', { ascending: true });

    // Fetch employee's duty pattern
    const empId = record.employee_id || record.employee?.id;
    const { data: empData } = await supabase
      .from('employees')
      .select('duty_pattern')
      .eq('id', empId)
      .single();

    const dutyPattern = empData?.duty_pattern;

    if (!schedulesData || schedulesData.length === 0) {
      setSearchSchedules([]);
      setSearchLoading(false);
      return;
    }

    const categorized = schedulesData.map(schedule => {
      let dutyStatus = 'N/A';
      if (dutyPattern?.start_date) {
        const cat = categorizeDateRange(
          dutyPattern,
          new Date(schedule.start_date + 'T00:00:00'),
          new Date(schedule.end_date + 'T00:00:00')
        );
        if (cat === 'off') dutyStatus = 'Off Period ✓';
        else if (cat === 'on') dutyStatus = 'On Period';
        else dutyStatus = 'Mixed';
      }
      return { ...schedule, dutyStatus };
    });

    const priorityOrder: Record<string, number> = { 'Off Period ✓': 0, 'Mixed': 1, 'On Period': 2, 'N/A': 3 };
    categorized.sort((a, b) => (priorityOrder[a.dutyStatus] ?? 3) - (priorityOrder[b.dutyStatus] ?? 3));

    setSearchSchedules(categorized);
    setSearchLoading(false);
  };

  const handleInformEmployee = async (schedule: TrainingSchedule & { dutyStatus: string }) => {
    if (!searchModalRecord) return;
    const empId = searchModalRecord.employee_id || searchModalRecord.employee?.id;
    setEmailSending(prev => ({ ...prev, [schedule.id]: true }));

    try {
      const res = await fetch('/api/inform-employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: empId,
          training_type: searchModalRecord.training_type,
          schedule: {
            start_date: schedule.start_date,
            end_date: schedule.end_date,
            location: schedule.location,
            dutyStatus: schedule.dutyStatus,
          },
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEmailStatus(prev => ({ ...prev, [schedule.id]: { success: true, message: data.message || 'Email sent!' } }));
      } else {
        setEmailStatus(prev => ({ ...prev, [schedule.id]: { success: false, message: data.error || 'Failed to send email' } }));
      }
    } catch (error) {
      setEmailStatus(prev => ({ ...prev, [schedule.id]: { success: false, message: 'Network error' } }));
    }
    setEmailSending(prev => ({ ...prev, [schedule.id]: false }));
  };

  // Filter records
  const filteredRecords = records.filter(record => {
    const matchesSearch = 
      record.employee?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.employee?.cpf?.includes(searchQuery) ||
      record.training_type.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRig = !selectedRig || record.employee?.rig_id === selectedRig;
    const matchesType = !selectedType || record.training_type === selectedType;
    const matchesStatus = !selectedStatus || record.calculated_status === selectedStatus;
    
    return matchesSearch && matchesRig && matchesType && matchesStatus;
  });

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
        <div>
          <h1 className="page-title">Training Records</h1>
          <p className="text-muted text-sm">
            Manage and track all employee training certifications
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={18} />
          Add Training Record
        </button>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="search-input" style={{ flex: 1, maxWidth: '300px' }}>
          <Search className="search-icon" size={16} />
          <input
            type="text"
            placeholder="Search by name, CPF, or training..."
            className="input"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="input select"
          style={{ width: 'auto', minWidth: '150px' }}
          value={selectedRig}
          onChange={e => setSelectedRig(e.target.value)}
        >
          <option value="">All Rigs</option>
          {rigs.map(rig => (
            <option key={rig.id} value={rig.id}>{rig.name}</option>
          ))}
        </select>

        <select
          className="input select"
          style={{ width: 'auto', minWidth: '150px' }}
          value={selectedType}
          onChange={e => setSelectedType(e.target.value)}
        >
          <option value="">All Training Types</option>
          {trainingTypes.map(type => (
            <option key={type.id} value={type.name}>{type.name}</option>
          ))}
        </select>

        <select
          className="input select"
          style={{ width: 'auto', minWidth: '150px' }}
          value={selectedStatus}
          onChange={e => setSelectedStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="SAFE">Valid</option>
          <option value="UPCOMING">Expiring Soon</option>
          <option value="OVERDUE">Expired</option>
        </select>

        <div className="text-sm text-muted">
          {filteredRecords.length} record{filteredRecords.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Training Records Table */}
      {filteredRecords.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <GraduationCap className="empty-state-icon" />
            <div className="empty-state-title">No Training Records Found</div>
            <p className="empty-state-description">
              {searchQuery || selectedRig || selectedType || selectedStatus
                ? 'Try adjusting your filters'
                : 'Add your first training record to get started'}
            </p>
            {!searchQuery && !selectedRig && !selectedType && !selectedStatus && (
              <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
                <Plus size={16} />
                Add Training Record
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Rig</th>
                <th>Training Type</th>
                <th>Completed</th>
                <th>Expires</th>
                <th>Days Left</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map(record => (
                <tr key={record.id}>
                  <td>
                    <div>
                      <div className="font-medium">{record.employee?.name || 'Unknown'}</div>
                      <div className="text-xs text-muted">{record.employee?.cpf}</div>
                    </div>
                  </td>
                  <td>{record.employee?.rig?.name || '-'}</td>
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
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.25rem 0.5rem' }}
                          onClick={() => {
                            setEditingRecord(record);
                            setEditRecord({
                              training_type: record.training_type,
                              completed_date: record.completed_date,
                              expiry_date: record.expiry_date,
                            });
                            setShowEditModal(true);
                          }}
                        >
                          <Edit2 size={14} />
                          Edit
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.25rem 0.5rem' }}
                          onClick={() => handleSearchTraining(record)}
                        >
                          <Search size={14} />
                          Search Training
                        </button>
                      </div>
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Training Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add Training Record"
        size="md"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </button>
            <button 
              className="btn btn-primary" 
              onClick={handleAddRecord}
              disabled={saving || !newRecord.employee_id || !newRecord.training_type || !newRecord.completed_date}
            >
              {saving && <span className="spinner" />}
              Add Record
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="input-group">
            <label className="input-label">Employee *</label>
            <select
              className="input select"
              value={newRecord.employee_id}
              onChange={e => setNewRecord({ ...newRecord, employee_id: e.target.value })}
            >
              <option value="">Select Employee</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.cpf})
                </option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">Training Type *</label>
            <select
              className="input select"
              value={newRecord.training_type}
              onChange={e => setNewRecord({ ...newRecord, training_type: e.target.value })}
            >
              <option value="">Select Training Type</option>
              {trainingTypes.map(type => (
                <option key={type.id} value={type.name}>{type.name}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">Completed Date *</label>
            <input
              type="date"
              className="input"
              value={newRecord.completed_date}
              onChange={e => setNewRecord({ ...newRecord, completed_date: e.target.value })}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Expiry Date (auto-calculated if empty)</label>
            <input
              type="date"
              className="input"
              value={newRecord.expiry_date}
              onChange={e => setNewRecord({ ...newRecord, expiry_date: e.target.value })}
            />
          </div>
        </div>
      </Modal>

      {/* Edit Training Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingRecord(null);
        }}
        title="Edit Training Record"
        size="md"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => {
              setShowEditModal(false);
              setEditingRecord(null);
            }}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleEditRecord}
              disabled={savingEdit || !editRecord.training_type || !editRecord.completed_date}
            >
              {savingEdit && <span className="spinner" />}
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
              value={editRecord.training_type}
              onChange={e => setEditRecord({ ...editRecord, training_type: e.target.value })}
            >
              <option value="">Select Training Type</option>
              {trainingTypes.map(type => (
                <option key={type.id} value={type.name}>{type.name}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label className="input-label">Completed Date *</label>
            <input
              type="date"
              className="input"
              value={editRecord.completed_date}
              onChange={e => setEditRecord({ ...editRecord, completed_date: e.target.value })}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Expiry Date (auto-calculated if empty)</label>
            <input
              type="date"
              className="input"
              value={editRecord.expiry_date}
              onChange={e => setEditRecord({ ...editRecord, expiry_date: e.target.value })}
            />
          </div>
        </div>
      </Modal>

      {/* Search Available Training Modal */}
      <Modal
        isOpen={showSearchModal}
        onClose={() => { setShowSearchModal(false); setSearchModalRecord(null); }}
        title={`Available Training — ${searchModalRecord?.training_type || ''}`}
        size="lg"
      >
        {searchModalRecord && (
          <div>
            <div className="text-sm text-muted" style={{ marginBottom: '1rem' }}>
              Employee: <strong>{searchModalRecord.employee?.name || 'Unknown'}</strong> •
              Expiry: {new Date(searchModalRecord.expiry_date).toLocaleDateString()}
            </div>

            {searchLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '2rem' }}>
                <span className="spinner" style={{ width: '1.5rem', height: '1.5rem' }} />
                <span className="text-muted">Searching available sessions...</span>
              </div>
            ) : searchSchedules.length === 0 ? (
              <div className="empty-state" style={{ padding: '2rem' }}>
                <Search className="empty-state-icon" />
                <div className="empty-state-title">No Training Added Yet</div>
                <p className="empty-state-description">
                  No upcoming {searchModalRecord.training_type} sessions found. Add schedules in Settings → Training Schedules.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {searchSchedules.map(schedule => (
                  <div
                    key={schedule.id}
                    style={{
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      background: schedule.dutyStatus === 'Off Period ✓' ? 'var(--status-safe-bg)' : 'var(--muted-bg)',
                      border: `1px solid ${schedule.dutyStatus === 'Off Period ✓' ? 'var(--status-safe)' : 'var(--border)'}`,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ flex: 1 }}>
                        <div className="font-medium" style={{ fontSize: '0.875rem' }}>
                          {new Date(schedule.start_date + 'T00:00:00').toLocaleDateString()} — {new Date(schedule.end_date + 'T00:00:00').toLocaleDateString()}
                        </div>
                        <div className="text-xs text-muted" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                          <MapPin size={12} />
                          {schedule.location}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.625rem',
                          borderRadius: '999px',
                          fontSize: '0.6875rem',
                          fontWeight: 600,
                          background: schedule.dutyStatus === 'Off Period ✓' ? 'var(--status-safe)' : schedule.dutyStatus === 'On Period' ? 'var(--status-upcoming)' : 'var(--text-muted)',
                          color: '#fff',
                          whiteSpace: 'nowrap',
                        }}>
                          {schedule.dutyStatus}
                        </span>
                        <button
                          className="btn btn-primary btn-sm"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.6875rem', whiteSpace: 'nowrap' }}
                          disabled={emailSending[schedule.id] || emailStatus[schedule.id]?.success}
                          onClick={() => handleInformEmployee(schedule)}
                        >
                          {emailSending[schedule.id] ? (
                            <span className="spinner" style={{ width: '0.75rem', height: '0.75rem' }} />
                          ) : (
                            <Mail size={12} />
                          )}
                          {emailStatus[schedule.id]?.success ? 'Sent ✓' : 'Inform Employee'}
                        </button>
                      </div>
                    </div>
                    {emailStatus[schedule.id] && (
                      <div style={{
                        marginTop: '0.5rem',
                        padding: '0.375rem 0.75rem',
                        borderRadius: 'var(--radius)',
                        fontSize: '0.75rem',
                        background: emailStatus[schedule.id].success ? 'var(--status-safe-bg)' : 'var(--status-overdue-bg, #fee2e2)',
                        color: emailStatus[schedule.id].success ? 'var(--status-safe)' : 'var(--status-overdue)',
                      }}>
                        {emailStatus[schedule.id].message}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
