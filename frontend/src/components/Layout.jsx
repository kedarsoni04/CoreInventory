import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Package, ArrowDownToLine, ArrowUpFromLine,
  ArrowLeftRight, ClipboardList, History, Warehouse, LogOut
} from 'lucide-react';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Products', icon: Package, to: '/products' },
];

const opsItems = [
  { label: 'Receipts', icon: ArrowDownToLine, to: '/receipts' },
  { label: 'Deliveries', icon: ArrowUpFromLine, to: '/deliveries' },
  { label: 'Transfers', icon: ArrowLeftRight, to: '/transfers' },
  { label: 'Adjustments', icon: ClipboardList, to: '/adjustments' },
  { label: 'Move History', icon: History, to: '/history' },
];

const settingsItems = [
  { label: 'Warehouses', icon: Warehouse, to: '/warehouses' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-mark">
            <div className="logo-icon">CI</div>
            <div>
              <div className="logo-text">CoreInventory</div>
              <div className="logo-sub">IMS v1.0</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <div className="nav-section-label">Overview</div>
            {navItems.map(item => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                <item.icon size={16} />
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="nav-section">
            <div className="nav-section-label">Operations</div>
            {opsItems.map(item => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                <item.icon size={16} />
                {item.label}
              </NavLink>
            ))}
          </div>

          <div className="nav-section">
            <div className="nav-section-label">Settings</div>
            {settingsItems.map(item => (
              <NavLink key={item.to} to={item.to} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
                <item.icon size={16} />
                {item.label}
              </NavLink>
            ))}
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">{user?.name?.[0]?.toUpperCase() || 'U'}</div>
            <div>
              <div className="user-name">{user?.name}</div>
              <div className="user-role">{user?.role}</div>
            </div>
            <button className="logout-btn" onClick={handleLogout} title="Logout">
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
