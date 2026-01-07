'use client';

// Force dynamic rendering since this page uses Clerk
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Search, Plus, Filter, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Avatar } from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { Employee, Rig, TrainingRecord, TrainingStatus } from '@/lib/types/database';
import { enrichTrainingRecords, getOverallStatus } from '@/lib/utils/training-status';
import Link from 'next/link';

interface EmployeeWithStatus extends Employee {
  overall_status: TrainingStatus;
}

export default function EmployeesPage() {
  const { user, isLoaded } = useUser();
  const searchParams = useSearchParams();
  const [employees, setEmployees] = useState<EmployeeWithStatus[]>([]);
  const [rigs, setRigs] = useState<Rig[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRig, setSelectedRig] = useState<string>(searchParams.get('rig') || '');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      
      try {
        // Fetch rigs
        const { data: rigsData } = await supabase
          .from('rigs')
          .select('*')
          .order('name');
        
        if (rigsData) setRigs(rigsData);

        // Fetch employees with their training records
        let query = supabase
          .from('employees')
          .select(`
            *,
            rig:rigs(id, name),
            training_records(*)
          `)
          .order('name');

        if (selectedRig) {
          query = query.eq('rig_id', selectedRig);
        }

        const { data: employeesData, error } = await query;

        if (error) {
          console.error('Error fetching employees:', error);
          return;
        }

        // Fetch grace periods
        const { data: graceSettings } = await supabase
          .from('grace_period_settings')
          .select('*');

        if (employeesData && graceSettings) {
          // Calculate overall status for each employee
          const employeesWithStatus = employeesData.map(emp => {
            const enrichedRecords = enrichTrainingRecords(
              emp.training_records || [],
              graceSettings
            );
            return {
              ...emp,
              overall_status: getOverallStatus(enrichedRecords),
            };
          });

          setEmployees(employeesWithStatus);
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }

    if (isLoaded) {
      fetchData();
    }
  }, [isLoaded, selectedRig]);

  // Filter employees by search and status
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.cpf.includes(searchQuery) ||
      emp.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = !selectedStatus || emp.overall_status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  if (!isLoaded || loading) {
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
          <h1 className="page-title">Employees</h1>
          <p className="text-muted text-sm">
            Manage employee profiles and view training status
          </p>
        </div>
        <Link href="/employees/new" className="btn btn-primary">
          <Plus size={18} />
          Add Employee
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <div className="search-input" style={{ flex: 1, maxWidth: '300px' }}>
          <Search className="search-icon" size={16} />
          <input
            type="text"
            placeholder="Search by name, CPF, or email..."
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
          value={selectedStatus}
          onChange={e => setSelectedStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="SAFE">Valid</option>
          <option value="UPCOMING">Expiring Soon</option>
          <option value="OVERDUE">Expired</option>
        </select>

        <div className="text-sm text-muted">
          {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Employees Table */}
      {filteredEmployees.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Users className="empty-state-icon" />
            <div className="empty-state-title">No Employees Found</div>
            <p className="empty-state-description">
              {searchQuery || selectedRig || selectedStatus
                ? 'Try adjusting your filters'
                : 'Add your first employee to get started'}
            </p>
            {!searchQuery && !selectedRig && !selectedStatus && (
              <Link href="/employees/new" className="btn btn-primary">
                <Plus size={16} />
                Add Employee
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>CPF</th>
                <th>Email</th>
                <th>Rig</th>
                <th>Training Status</th>
                <th style={{ width: '100px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map(employee => (
                <tr key={employee.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <Avatar 
                        photoUrl={employee.photo_url} 
                        name={employee.name} 
                        size="sm" 
                      />
                      <div>
                        <div className="font-medium">{employee.name}</div>
                        <div className="text-xs text-muted">{employee.role.replace('_', ' ')}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-muted">{employee.cpf}</td>
                  <td className="text-muted">{employee.email}</td>
                  <td>{(employee.rig as any)?.name || '-'}</td>
                  <td>
                    <StatusBadge status={employee.overall_status} size="sm" />
                  </td>
                  <td>
                    <Link 
                      href={`/employees/${employee.id}`}
                      className="btn btn-secondary btn-sm"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
