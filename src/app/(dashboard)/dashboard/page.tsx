'use client';

// Force dynamic rendering since this page uses auth
export const dynamic = 'force-dynamic';

import { useAuth } from '@/lib/supabase/auth-context';
import { useEffect, useState } from 'react';
import { Users, GraduationCap, AlertTriangle, CheckCircle, Clock, TrendingUp, Search, MapPin, Mail, X } from 'lucide-react';
import { StatsCard } from '@/components/ui/StatsCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Modal } from '@/components/ui/Modal';
import { createClient } from '@/lib/supabase/client';
import type { Employee, TrainingRecord, Rig, DashboardStats, TrainingSchedule } from '@/lib/types/database';
import { enrichTrainingRecords, getOverallStatus } from '@/lib/utils/training-status';
import { categorizeDateRange } from '@/lib/utils/duty-utils';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, userMetadata, loading: authLoading } = useAuth();
  const userRole = userMetadata.role || 'employee';
  const [stats, setStats] = useState<DashboardStats>({
    total_employees: 0,
    safe_count: 0,
    upcoming_count: 0,
    overdue_count: 0,
  });
  const [recentTraining, setRecentTraining] = useState<any[]>([]);
  const [rigs, setRigs] = useState<Rig[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminRigId, setAdminRigId] = useState<string | null>(null);

  // Search available training modal state
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchModalRecord, setSearchModalRecord] = useState<any>(null);
  const [searchSchedules, setSearchSchedules] = useState<(TrainingSchedule & { dutyStatus: string })[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [emailSending, setEmailSending] = useState<Record<string, boolean>>({});
  const [emailStatus, setEmailStatus] = useState<Record<string, { success: boolean; message: string }>>({});

  const handleSearchTraining = async (record: any) => {
    setSearchModalRecord(record);
    setShowSearchModal(true);
    setSearchLoading(true);
    setSearchSchedules([]);
    setEmailStatus({});

    const supabase = createClient();

    // Fetch matching training schedules (future ones only)
    const today = new Date().toISOString().split('T')[0];
    const { data: schedulesData } = await supabase
      .from('training_schedules')
      .select('*')
      .eq('training_type', record.training_type)
      .gte('start_date', today)
      .order('start_date', { ascending: true });

    // Fetch employee's duty pattern
    const { data: empData } = await supabase
      .from('employees')
      .select('duty_pattern')
      .eq('id', record.employee_id)
      .single();

    const dutyPattern = empData?.duty_pattern;

    if (!schedulesData || schedulesData.length === 0) {
      setSearchSchedules([]);
      setSearchLoading(false);
      return;
    }

    // Categorize each schedule by duty status and sort
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

    // Sort: off period first, then on period, then mixed/N/A
    const priorityOrder: Record<string, number> = { 'Off Period ✓': 0, 'Mixed': 1, 'On Period': 2, 'N/A': 3 };
    categorized.sort((a, b) => (priorityOrder[a.dutyStatus] ?? 3) - (priorityOrder[b.dutyStatus] ?? 3));

    setSearchSchedules(categorized);
    setSearchLoading(false);
  };

  const handleInformEmployee = async (schedule: TrainingSchedule & { dutyStatus: string }) => {
    if (!searchModalRecord) return;
    setEmailSending(prev => ({ ...prev, [schedule.id]: true }));

    try {
      const res = await fetch('/api/inform-employee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee_id: searchModalRecord.employee_id,
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
        setEmailStatus(prev => ({ ...prev, [schedule.id]: { success: true, message: data.message || 'Email sent successfully!' } }));
      } else {
        setEmailStatus(prev => ({ ...prev, [schedule.id]: { success: false, message: data.error || 'Failed to send email' } }));
      }
    } catch (error) {
      setEmailStatus(prev => ({ ...prev, [schedule.id]: { success: false, message: 'Network error' } }));
    }
    setEmailSending(prev => ({ ...prev, [schedule.id]: false }));
  };

  useEffect(() => {
    async function fetchDashboardData() {
      const supabase = createClient();
      
      try {
        // For rig_admin, first get their assigned rig
        let rigFilter: string | null = null;
        if (userRole === 'rig_admin' && user) {
          const { data: adminEmployee } = await supabase
            .from('employees')
            .select('rig_id')
            .eq('clerk_user_id', user.id)
            .single();
          
          if (adminEmployee?.rig_id) {
            rigFilter = adminEmployee.rig_id;
            setAdminRigId(rigFilter);
          }
        }

        // Fetch rigs (filter for rig_admin)
        let rigsQuery = supabase.from('rigs').select('*').order('name');
        if (rigFilter) {
          rigsQuery = rigsQuery.eq('id', rigFilter);
        }
        const { data: rigsData } = await rigsQuery;
        if (rigsData) setRigs(rigsData);

        // Fetch employees count (filter for rig_admin)
        let employeeQuery = supabase.from('employees').select('*', { count: 'exact', head: true });
        if (rigFilter) {
          employeeQuery = employeeQuery.eq('rig_id', rigFilter);
        }
        const { count: employeeCount } = await employeeQuery;

        // Fetch training records with grace periods (filter for rig_admin)
        let trainingQuery = supabase
          .from('training_records')
          .select('*, employees(name, cpf, rig_id)')
          .order('expiry_date', { ascending: true })
          .limit(10);
        
        // For rig_admin, we need to filter by employee's rig_id via join
        const { data: trainingData } = await trainingQuery;

        const { data: graceSettings } = await supabase
          .from('grace_period_settings')
          .select('*');

        if (trainingData && graceSettings) {
          // Filter training data for rig_admin
          let filteredTrainingData = trainingData;
          if (rigFilter) {
            filteredTrainingData = trainingData.filter(
              (t: any) => t.employees?.rig_id === rigFilter
            );
          }

          const enriched = enrichTrainingRecords(filteredTrainingData, graceSettings);
          
          // Calculate stats
          const safeCount = enriched.filter(t => t.calculated_status === 'SAFE').length;
          const upcomingCount = enriched.filter(t => t.calculated_status === 'UPCOMING').length;
          const overdueCount = enriched.filter(t => t.calculated_status === 'OVERDUE').length;

          setStats({
            total_employees: employeeCount || 0,
            safe_count: safeCount,
            upcoming_count: upcomingCount,
            overdue_count: overdueCount,
          });

          // Set recent training that needs attention (upcoming + overdue first)
          const needsAttention = enriched
            .filter(t => t.calculated_status !== 'SAFE')
            .slice(0, 5)
            .map(t => ({
              ...t,
              employee: (t as any).employees,
            }));
          
          setRecentTraining(needsAttention);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      fetchDashboardData();
    }
  }, [authLoading, user, userRole]);

  if (authLoading || loading) {
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
          <h1 className="page-title">Dashboard</h1>
          <p className="text-muted text-sm">
            Welcome back, {userMetadata.firstName || 'User'}! Here's an overview of training statuses.
          </p>
        </div>
        <Link href="/training" className="btn btn-primary">
          <GraduationCap size={18} />
          View All Training
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <StatsCard
          label="Total Employees"
          value={stats.total_employees}
          icon={Users}
          variant="primary"
        />
        <StatsCard
          label="Valid Training"
          value={stats.safe_count}
          icon={CheckCircle}
          variant="safe"
        />
        <StatsCard
          label="Expiring Soon"
          value={stats.upcoming_count}
          icon={Clock}
          variant="upcoming"
        />
        <StatsCard
          label="Expired"
          value={stats.overdue_count}
          icon={AlertTriangle}
          variant="overdue"
        />
      </div>

      {/* Content Grid */}
      <div className="dashboard-grid">
        {/* Training Needs Attention */}
        <div className="card" style={{ gridColumn: recentTraining.length === 0 ? 'span 2' : undefined }}>
          <div className="card-header">
            <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Training Needs Attention</h3>
          </div>
          {recentTraining.length === 0 ? (
            <div className="empty-state">
              <CheckCircle className="empty-state-icon" style={{ color: 'var(--status-safe)' }} />
              <div className="empty-state-title">All Training Up to Date!</div>
              <p className="empty-state-description">
                No training records require immediate attention.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentTraining.map((record) => (
                <div
                  key={record.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.75rem',
                    background: 'var(--muted-bg)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div>
                    <div className="font-medium text-sm">
                      {record.employee?.name || 'Unknown'}
                    </div>
                    <div className="text-xs text-muted">
                      {record.training_type} • Expires: {new Date(record.expiry_date).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <StatusBadge status={record.calculated_status} size="sm" />
                    <button
                      className="btn btn-secondary btn-sm"
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.6875rem' }}
                      onClick={() => handleSearchTraining(record)}
                    >
                      <Search size={12} />
                      Search Training
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rigs Overview */}
        {userRole !== 'employee' && (
          <div className="card">
            <div className="card-header">
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Rigs Overview</h3>
              {userRole === 'super_admin' && (
                <Link href="/admin/rigs" className="btn btn-secondary btn-sm">
                  Manage Rigs
                </Link>
              )}
            </div>
            {rigs.length === 0 ? (
              <div className="empty-state">
                <TrendingUp className="empty-state-icon" />
                <div className="empty-state-title">No Rigs Yet</div>
                <p className="empty-state-description">
                  Add rigs to start managing training.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {rigs.map((rig) => (
                  <div
                    key={rig.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem',
                      background: 'var(--muted-bg)',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    <span className="font-medium text-sm">{rig.name}</span>
                    <Link 
                      href={`/employees?rig=${rig.id}`}
                      className="text-xs"
                      style={{ color: 'var(--primary-600)' }}
                    >
                      View Employees →
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

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
              Expired: {new Date(searchModalRecord.expiry_date).toLocaleDateString()}
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
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      background: schedule.dutyStatus === 'Off Period ✓' ? 'var(--status-safe-bg)' : 'var(--muted-bg)',
                      border: `1px solid ${schedule.dutyStatus === 'Off Period ✓' ? 'var(--status-safe)' : 'var(--border)'}`,
                    }}
                  >
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
                    {emailStatus[schedule.id] && (
                      <div style={{
                        width: '100%',
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
