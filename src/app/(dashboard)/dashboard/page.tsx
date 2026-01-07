'use client';

// Force dynamic rendering since this page uses auth
export const dynamic = 'force-dynamic';

import { useAuth } from '@/lib/supabase/auth-context';
import { useEffect, useState } from 'react';
import { Users, GraduationCap, AlertTriangle, CheckCircle, Clock, TrendingUp } from 'lucide-react';
import { StatsCard } from '@/components/ui/StatsCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { createClient } from '@/lib/supabase/client';
import type { Employee, TrainingRecord, Rig, DashboardStats } from '@/lib/types/database';
import { enrichTrainingRecords, getOverallStatus } from '@/lib/utils/training-status';
import Link from 'next/link';

export default function DashboardPage() {
  const { userMetadata, loading: authLoading } = useAuth();
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

  useEffect(() => {
    async function fetchDashboardData() {
      const supabase = createClient();
      
      try {
        // Fetch rigs
        const { data: rigsData } = await supabase
          .from('rigs')
          .select('*')
          .order('name');
        
        if (rigsData) setRigs(rigsData);

        // Fetch employees count
        const { count: employeeCount } = await supabase
          .from('employees')
          .select('*', { count: 'exact', head: true });

        // Fetch training records with grace periods
        const { data: trainingData } = await supabase
          .from('training_records')
          .select('*, employees(name, cpf, rig_id)')
          .order('expiry_date', { ascending: true })
          .limit(10);

        const { data: graceSettings } = await supabase
          .from('grace_period_settings')
          .select('*');

        if (trainingData && graceSettings) {
          const enriched = enrichTrainingRecords(trainingData, graceSettings);
          
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
  }, [authLoading]);

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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
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
                  <StatusBadge status={record.calculated_status} size="sm" />
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
    </div>
  );
}
