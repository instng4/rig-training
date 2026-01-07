'use client';

// Force dynamic rendering since this page uses Clerk
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Save, Plus, Trash2, Settings as SettingsIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import type { GracePeriodSetting, TrainingTypeConfig, EmailTemplate } from '@/lib/types/database';

export default function SettingsPage() {
  const { user } = useUser();
  const [userRole, setUserRole] = useState<string>('employee');
  const [activeTab, setActiveTab] = useState<'grace' | 'training' | 'email'>('grace');
  const [loading, setLoading] = useState(true);
  
  // Data
  const [graceSettings, setGraceSettings] = useState<GracePeriodSetting[]>([]);
  const [trainingTypes, setTrainingTypes] = useState<TrainingTypeConfig[]>([]);
  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  
  // Edit states
  const [editedGrace, setEditedGrace] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  
  // Add training type modal
  const [showAddType, setShowAddType] = useState(false);
  const [newType, setNewType] = useState({ name: '', validity_months: 12 });
  const [deleteTypeId, setDeleteTypeId] = useState<string | null>(null);

  useEffect(() => {
    if (user?.publicMetadata?.role) {
      setUserRole(user.publicMetadata.role as string);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    const supabase = createClient();
    
    try {
      const [graceRes, typesRes, emailRes] = await Promise.all([
        supabase.from('grace_period_settings').select('*').order('training_type'),
        supabase.from('training_types').select('*').order('name'),
        supabase.from('email_templates').select('*'),
      ]);

      if (graceRes.data) {
        setGraceSettings(graceRes.data);
        const graceMap: Record<string, number> = {};
        graceRes.data.forEach(g => { graceMap[g.id] = g.grace_months; });
        setEditedGrace(graceMap);
      }
      if (typesRes.data) setTrainingTypes(typesRes.data);
      if (emailRes.data) setEmailTemplates(emailRes.data);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  }

  const handleSaveGrace = async () => {
    setSaving(true);
    const supabase = createClient();
    
    for (const [id, months] of Object.entries(editedGrace)) {
      await supabase
        .from('grace_period_settings')
        .update({ grace_months: months })
        .eq('id', id);
    }
    
    setSaving(false);
    fetchData();
  };

  const handleAddTrainingType = async () => {
    if (!newType.name.trim()) return;
    
    setSaving(true);
    const supabase = createClient();
    
    // Add training type
    await supabase.from('training_types').insert({
      name: newType.name,
      default_validity_months: newType.validity_months,
    });
    
    // Add grace period setting for new type
    await supabase.from('grace_period_settings').insert({
      training_type: newType.name,
      grace_months: 3,
    });
    
    setShowAddType(false);
    setNewType({ name: '', validity_months: 12 });
    setSaving(false);
    fetchData();
  };

  const handleDeleteType = async () => {
    if (!deleteTypeId) return;
    
    const supabase = createClient();
    const typeToDelete = trainingTypes.find(t => t.id === deleteTypeId);
    
    await supabase.from('training_types').delete().eq('id', deleteTypeId);
    if (typeToDelete) {
      await supabase.from('grace_period_settings').delete().eq('training_type', typeToDelete.name);
    }
    
    setDeleteTypeId(null);
    fetchData();
  };

  const handleSaveTemplate = async (template: EmailTemplate) => {
    setSaving(true);
    const supabase = createClient();
    
    await supabase
      .from('email_templates')
      .update({ subject: template.subject, body: template.body })
      .eq('id', template.id);
    
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '400px' }}>
        <div className="spinner" style={{ width: '2rem', height: '2rem' }} />
      </div>
    );
  }

  if (userRole === 'employee') {
    return (
      <div className="card">
        <div className="empty-state">
          <SettingsIcon className="empty-state-icon" />
          <div className="empty-state-title">Access Denied</div>
          <p className="empty-state-description">
            You don't have permission to access settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="text-muted text-sm">
            Manage system settings and configurations
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        marginBottom: '1.5rem',
        borderBottom: '1px solid var(--card-border)',
        paddingBottom: '0.5rem',
      }}>
        <button
          className={`btn ${activeTab === 'grace' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('grace')}
        >
          Grace Periods
        </button>
        {userRole === 'super_admin' && (
          <>
            <button
              className={`btn ${activeTab === 'training' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('training')}
            >
              Training Types
            </button>
            <button
              className={`btn ${activeTab === 'email' ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setActiveTab('email')}
            >
              Email Templates
            </button>
          </>
        )}
      </div>

      {/* Grace Periods Tab */}
      {activeTab === 'grace' && (
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Grace Period Settings</h3>
            <button 
              className="btn btn-primary btn-sm" 
              onClick={handleSaveGrace}
              disabled={saving}
            >
              {saving && <span className="spinner" />}
              <Save size={16} />
              Save Changes
            </button>
          </div>
          <p className="text-sm text-muted mb-4">
            Grace period determines when training status changes from "Valid" to "Expiring Soon".
          </p>
          <div style={{ display: 'grid', gap: '1rem', maxWidth: '400px' }}>
            {graceSettings.map(setting => (
              <div key={setting.id} className="input-group">
                <label className="input-label">{setting.training_type}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    className="input"
                    min={1}
                    max={12}
                    value={editedGrace[setting.id] || setting.grace_months}
                    onChange={e => setEditedGrace({
                      ...editedGrace,
                      [setting.id]: parseInt(e.target.value) || 3,
                    })}
                  />
                  <span className="text-sm text-muted">months</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Training Types Tab */}
      {activeTab === 'training' && userRole === 'super_admin' && (
        <div className="card">
          <div className="card-header">
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Training Types</h3>
            <button className="btn btn-primary btn-sm" onClick={() => setShowAddType(true)}>
              <Plus size={16} />
              Add Type
            </button>
          </div>
          <div className="table-container" style={{ border: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Training Type</th>
                  <th>Default Validity</th>
                  <th>Status</th>
                  <th style={{ width: '80px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {trainingTypes.map(type => (
                  <tr key={type.id}>
                    <td className="font-medium">{type.name}</td>
                    <td>{type.default_validity_months} months</td>
                    <td>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        background: type.is_active ? 'var(--status-safe-bg)' : 'var(--muted-bg)',
                        color: type.is_active ? 'var(--status-safe)' : 'var(--muted)',
                      }}>
                        {type.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => setDeleteTypeId(type.id)}
                        style={{ padding: '0.25rem 0.5rem' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Email Templates Tab */}
      {activeTab === 'email' && userRole === 'super_admin' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {emailTemplates.map(template => (
            <div key={template.id} className="card">
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem' }}>
                {template.template_type === 'upcoming_reminder' ? 'Upcoming Reminder' : 'Overdue Urgent'}
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="input-group">
                  <label className="input-label">Subject</label>
                  <input
                    type="text"
                    className="input"
                    value={template.subject}
                    onChange={e => {
                      const updated = emailTemplates.map(t =>
                        t.id === template.id ? { ...t, subject: e.target.value } : t
                      );
                      setEmailTemplates(updated);
                    }}
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Body</label>
                  <textarea
                    className="input"
                    rows={6}
                    value={template.body}
                    onChange={e => {
                      const updated = emailTemplates.map(t =>
                        t.id === template.id ? { ...t, body: e.target.value } : t
                      );
                      setEmailTemplates(updated);
                    }}
                  />
                  <div className="text-xs text-muted mt-1">
                    Available variables: {'{{employee_name}}'}, {'{{training_type}}'}, {'{{expiry_date}}'}, {'{{days_until_expiry}}'}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleSaveTemplate(template)}
                    disabled={saving}
                  >
                    <Save size={14} />
                    Save Template
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Training Type Modal */}
      <Modal
        isOpen={showAddType}
        onClose={() => setShowAddType(false)}
        title="Add Training Type"
        size="sm"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowAddType(false)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleAddTrainingType}
              disabled={saving || !newType.name.trim()}
            >
              {saving && <span className="spinner" />}
              Add Type
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="input-group">
            <label className="input-label">Training Type Name</label>
            <input
              type="text"
              className="input"
              value={newType.name}
              onChange={e => setNewType({ ...newType, name: e.target.value })}
              placeholder="e.g., H2S Safety"
            />
          </div>
          <div className="input-group">
            <label className="input-label">Default Validity (months)</label>
            <input
              type="number"
              className="input"
              min={1}
              value={newType.validity_months}
              onChange={e => setNewType({ ...newType, validity_months: parseInt(e.target.value) || 12 })}
            />
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteTypeId}
        onClose={() => setDeleteTypeId(null)}
        onConfirm={handleDeleteType}
        title="Delete Training Type"
        message="Are you sure you want to delete this training type? This will not delete existing training records."
        confirmText="Delete"
        confirmVariant="danger"
      />
    </div>
  );
}
