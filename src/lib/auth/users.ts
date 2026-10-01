import { User, EmployeeProfile, Device } from '@/types';

export const SEED_USERS: User[] = [
  {
    id: 'usr_emp_01',
    name: 'Sarah Connor',
    email: 'sarah.connor@cyberdyne.corp',
    role: 'EMPLOYEE',
    department: 'Human Resources',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    createdAt: '2025-01-15T08:00:00Z',
  },
  {
    id: 'usr_emp_02',
    name: 'David Lightman',
    email: 'david.lightman@cyberdyne.corp',
    role: 'EMPLOYEE',
    department: 'Finance & Planning',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    createdAt: '2025-03-10T09:30:00Z',
  },
  {
    id: 'usr_agent_01',
    name: 'Alex Mercer',
    email: 'alex.mercer@cyberdyne.corp',
    role: 'IT_AGENT',
    department: 'IT Service Management',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    createdAt: '2024-06-01T10:00:00Z',
  },
  {
    id: 'usr_admin_01',
    name: 'Jordan Hayes',
    email: 'jordan.hayes@cyberdyne.corp',
    role: 'IT_ADMIN',
    department: 'Enterprise Infrastructure & Security',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    createdAt: '2023-11-20T07:45:00Z',
  },
];

export const SEED_EMPLOYEES: EmployeeProfile[] = [
  {
    id: 'emp_01',
    userId: 'usr_emp_01',
    title: 'Senior Talent Acquisition Partner',
    managerEmail: 'marcus.wright@cyberdyne.corp',
    accountStatus: 'LOCKED', // Intentionally locked for Demo Scenario 1!
    mfaEnabled: true,
    mfaSynced: false,
    failedLoginCount: 5,
    lastPasswordChange: '2026-08-10T14:22:00Z',
    department: 'Human Resources',
  },
  {
    id: 'emp_02',
    userId: 'usr_emp_02',
    title: 'Financial Systems Analyst',
    managerEmail: 'katherine.brewster@cyberdyne.corp',
    accountStatus: 'ACTIVE',
    mfaEnabled: true,
    mfaSynced: true,
    failedLoginCount: 0,
    lastPasswordChange: '2026-09-01T11:15:00Z',
    department: 'Finance & Planning',
  },
];

export const SEED_DEVICES: Device[] = [
  {
    id: 'dev_sarah_mbp',
    userId: 'usr_emp_01',
    deviceName: 'CYBER-LT-SARAHC',
    os: 'macOS Sequoia',
    osVersion: '15.3.1',
    complianceStatus: 'COMPLIANT',
    diskFreeGb: 124.5,
    ipAddress: '10.240.12.88',
    vpnClientVersion: '5.1.2-outdated',
    lastSeen: new Date().toISOString(),
  },
  {
    id: 'dev_david_win',
    userId: 'usr_emp_02',
    deviceName: 'CYBER-DSK-DAVIDL',
    os: 'Windows 11 Enterprise',
    osVersion: '24H2',
    complianceStatus: 'COMPLIANT',
    diskFreeGb: 452.0,
    ipAddress: '10.240.14.102',
    vpnClientVersion: '5.2.0-current',
    lastSeen: new Date().toISOString(),
  },
];
