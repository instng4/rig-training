'use client';

// Force dynamic rendering since this page uses Clerk
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Plus, Edit2, Trash2, Save, X, Building2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Modal, ConfirmModal } from '@/components/ui/Modal';
import type { Rig } from '@/lib/types/database';

export default function RigsPage() {
  const { user } = useUser();
  const [userRole, setUserRole] = useState<string>('employee');
  const [rigs, setRigs] = useState<Rig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRigName, setNewRigName] = useState('');
  const [editingRig, setEditingRig] = useState<Rig | null>(null);
  const [deleteRigId, setDeleteRigId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.publicMetadata?.role) {
      setUserRole(user.publicMetadata.role as string);
    }
  }, [user]);

  useEffect(() => {
    fetchRigs();
  }, []);

  async function fetchRigs() {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('rigs')
      .select('*')
      .order('name');

    if (data) setRigs(data);
    setLoading(false);
  }

  const handleAddRig = async () => {
    if (!newRigName.trim()) return;
    
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('rigs')
      .insert({ name: newRigName.trim() });

    if (error) {
      console.error('Error adding rig:', error);
    } else {
      setShowAddModal(false);
      setNewRigName('');
      fetchRigs();
    }
    setSaving(false);
  };

  const handleUpdateRig = async () => {
    if (!editingRig) return;
    
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from('rigs')
      .update({ name: editingRig.name })
      .eq('id', editingRig.id);

    if (error) {
      console.error('Error updating rig:', error);
    } else {
      setEditingRig(null);
      fetchRigs();
    }
    setSaving(false);
  };

  const handleDeleteRig = async () => {
    if (!deleteRigId) return;
    
    const supabase = createClient();
    const { error } = await supabase
      .from('rigs')
      .delete()
      .eq('id', deleteRigId);

    if (error) {
      console.error('Error deleting rig:', error);
    } else {
      setDeleteRigId(null);
      fetchRigs();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '400px' }}>
        <div className="spinner" style={{ width: '2rem', height: '2rem' }} />
      </div>
    );
  }

  if (userRole !== 'super_admin') {
    return (
      <div className="card">
        <div className="empty-state">
          <Building2 className="empty-state-icon" />
          <div className="empty-state-title">Access Denied</div>
          <p className="empty-state-description">
            Only Super Admins can manage rigs.
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
          <h1 className="page-title">Manage Rigs</h1>
          <p className="text-muted text-sm">
            Add, edit, or remove rigs from the system
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={18} />
          Add Rig
        </button>
      </div>

      {/* Rigs List */}
      {rigs.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Building2 className="empty-state-icon" />
            <div className="empty-state-title">No Rigs</div>
            <p className="empty-state-description">
              Add your first rig to get started.
            </p>
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              <Plus size={16} />
              Add Rig
            </button>
          </div>
        </div>
      ) : (
        <div className="card">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {rigs.map(rig => (
              <div
                key={rig.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem',
                  background: 'var(--muted-bg)',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                {editingRig?.id === rig.id ? (
                  <div className="flex items-center gap-2" style={{ flex: 1 }}>
                    <input
                      type="text"
                      className="input"
                      value={editingRig.name}
                      onChange={e => setEditingRig({ ...editingRig, name: e.target.value })}
                      style={{ maxWidth: '300px' }}
                    />
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={handleUpdateRig}
                      disabled={saving}
                    >
                      <Save size={14} />
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setEditingRig(null)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div>
                      <div className="font-medium">{rig.name}</div>
                      <div className="text-xs text-muted">
                        Added {new Date(rig.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setEditingRig(rig)}
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => setDeleteRigId(rig.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Rig Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Rig"
        size="sm"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleAddRig}
              disabled={saving || !newRigName.trim()}
            >
              {saving && <span className="spinner" />}
              Add Rig
            </button>
          </>
        }
      >
        <div className="input-group">
          <label className="input-label">Rig Name</label>
          <input
            type="text"
            className="input"
            value={newRigName}
            onChange={e => setNewRigName(e.target.value)}
            placeholder="e.g., NG-1500-5"
          />
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={!!deleteRigId}
        onClose={() => setDeleteRigId(null)}
        onConfirm={handleDeleteRig}
        title="Delete Rig"
        message="Are you sure you want to delete this rig? Employees assigned to this rig will have their rig assignment cleared."
        confirmText="Delete"
        confirmVariant="danger"
      />
    </div>
  );
}
