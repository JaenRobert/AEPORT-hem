import React from 'react';
import './Navigation.css';

export default function Navigation() {
  const navItems = [
    { label: '🏠 Hem', path: '/index.html', title: 'Startsida' },
    { label: '💬 Chat', path: '/chat.html', title: 'AI Chat Interface' },
    { label: '🎛️ Konsol', path: '/console.html', title: 'WebSocket Console' },
    { label: '📊 Dashboard', path: '/dashboard.html', title: 'System Dashboard' },
    { label: '📋 Ledger', path: '/ledger.html', title: 'Arvskedjan Log' },
    { label: '⚙️ Settings', path: '/settings.html', title: 'Inställningar' },
  ];

  return (
    <nav className="main-navigation">
      <div className="nav-brand">
        <span className="nav-logo">ÆSI</span>
        <span className="nav-title">NEXUS</span>
      </div>
      <div className="nav-items">
        {navItems.map((item, index) => (
          <a
            key={index}
            href={item.path}
            className="nav-button"
            title={item.title}
          >
            {item.label}
          </a>
        ))}
      </div>
      <div className="nav-status">
        <span className="status-indicator" title="Server Status"></span>
      </div>
    </nav>
  );
}
