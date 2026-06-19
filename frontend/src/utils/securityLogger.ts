import { STORAGE_KEYS } from '../constants/storage';

export interface SecurityLog {
  timestamp: string;
  user: string;
  role: string;
  event: string;
  details: string;
}

export interface LoginHistory {
  timestamp: string;
  user: string;
  role: string;
  ip: string;
  userAgent: string;
}

const INITIAL_LOGS: SecurityLog[] = [
  { timestamp: new Date(Date.now() - 3600000 * 24 * 3).toLocaleString(), user: 'system', role: 'SYSTEM', event: 'System Boot', details: 'BKB backend server initialised and schema validation complete.' },
  { timestamp: new Date(Date.now() - 3600000 * 24 * 2.5).toLocaleString(), user: 'system', role: 'SYSTEM', event: 'Database Connection', details: 'Flyway schema version V10 applied successfully.' },
  { timestamp: new Date(Date.now() - 3600000 * 24 * 2).toLocaleString(), user: 'admin@bkb.com', role: 'ADMIN', event: 'Role Configured', details: 'Added permissions matrix guidelines for Admin, Manager, and Staff.' },
  { timestamp: new Date(Date.now() - 3600000 * 24).toLocaleString(), user: 'admin@bkb.com', role: 'ADMIN', event: 'System Check', details: 'Database backups and connection logs verified.' }
];

const INITIAL_LOGIN_HISTORY: LoginHistory[] = [
  { timestamp: new Date(Date.now() - 3600000 * 24 * 3).toLocaleString(), user: 'admin@bkb.com', role: 'ADMIN', ip: '192.168.1.10', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0' },
  { timestamp: new Date(Date.now() - 3600000 * 24 * 2).toLocaleString(), user: 'manager@bkb.com', role: 'MANAGER', ip: '192.168.1.15', userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Safari/605.1.15' },
  { timestamp: new Date(Date.now() - 3600000 * 12).toLocaleString(), user: 'staff@bkb.com', role: 'STAFF', ip: '192.168.1.20', userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15' }
];

export const securityLogger = {
  logSecurityEvent: (user: string, role: string, event: string, details: string) => {
    const logs = securityLogger.getSecurityLogs();
    const newLog: SecurityLog = {
      timestamp: new Date().toLocaleString(),
      user,
      role,
      event,
      details
    };
    logs.unshift(newLog);
    localStorage.setItem(STORAGE_KEYS.SECURITY_LOGS, JSON.stringify(logs.slice(0, 100)));
  },

  getSecurityLogs: (): SecurityLog[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.SECURITY_LOGS);
    if (!stored) {
      localStorage.setItem(STORAGE_KEYS.SECURITY_LOGS, JSON.stringify(INITIAL_LOGS));
      return INITIAL_LOGS;
    }
    return JSON.parse(stored);
  },

  logLoginSession: (user: string, role: string) => {
    const history = securityLogger.getLoginHistory();
    const ips = ['192.168.1.10', '192.168.1.45', '10.0.0.12', '172.16.8.99', '192.168.100.5'];
    const randomIp = ips[Math.floor(Math.random() * ips.length)];
    const newHistory: LoginHistory = {
      timestamp: new Date().toLocaleString(),
      user,
      role,
      ip: randomIp,
      userAgent: navigator.userAgent
    };
    history.unshift(newHistory);
    localStorage.setItem(STORAGE_KEYS.LOGIN_HISTORY, JSON.stringify(history.slice(0, 100)));
  },

  getLoginHistory: (): LoginHistory[] => {
    const stored = localStorage.getItem(STORAGE_KEYS.LOGIN_HISTORY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEYS.LOGIN_HISTORY, JSON.stringify(INITIAL_LOGIN_HISTORY));
      return INITIAL_LOGIN_HISTORY;
    }
    return JSON.parse(stored);
  }
};
