import React from 'react';

interface StatTileProps {
  label: string;
  value: number | string;
  icon: string;
  tone?: 'primary' | 'success' | 'info' | 'warning' | 'muted';
}

// A compact dashboard statistic.
//
// The older `.stats-card` centres its text but its icon rule has the centring
// margin commented out, so the icon sits left of centred text. That reads as
// merely loose across four wide columns and as plainly broken across six
// narrow ones. This lays the icon and the text out on one row instead, which
// aligns at any column width and leaves the original class untouched for the
// panels already using it.
const StatTile: React.FC<StatTileProps> = ({ label, value, icon, tone = 'primary' }) => (
  <div className="bma-stat">
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", width: '100%' }}>
      <div style={{ display: "flex", alignItems: "center", gap: "10px", width: '100%' }}>
        <span className={`bma-stat-icon bma-stat-icon--${tone}`}>
          <i className={icon} aria-hidden="true"></i>
        </span>
        <span className="bma-stat-body">
          <span className="bma-stat-value">{value}</span>
        </span>
      </div>
      <span className="bma-stat-label">{label}</span>
    </div>
  </div>
);

export default StatTile;
