import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  radius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

/** A single shimmer bar. Building block for table/card skeletons below. */
export const Skeleton: React.FC<SkeletonProps> = ({ width = '100%', height = 14, radius = 6, className = '', style }) => (
  <span
    className={`admin-skeleton ${className}`}
    style={{ width, height, borderRadius: radius, ...style }}
  />
);

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

/** Matches the shape of the glass tables used across the dashboards. */
export const TableSkeleton: React.FC<TableSkeletonProps> = ({ rows = 5, columns = 5 }) => (
  <div className="admin-skeleton-table" aria-busy="true" aria-label="Loading data">
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div className="admin-skeleton-row" key={rowIndex}>
        {Array.from({ length: columns }).map((_, colIndex) => (
          <Skeleton key={colIndex} height={16} width={colIndex === 0 ? '70%' : '100%'} />
        ))}
      </div>
    ))}
  </div>
);

interface CardSkeletonProps {
  count?: number;
}

/** Matches the glass "card" list layout (e.g. service cards). */
export const CardSkeleton: React.FC<CardSkeletonProps> = ({ count = 3 }) => (
  <div className="admin-skeleton-cards" aria-busy="true" aria-label="Loading data">
    {Array.from({ length: count }).map((_, i) => (
      <div className="admin-skeleton-card" key={i}>
        <Skeleton height={120} radius={10} />
        <Skeleton height={16} width="60%" style={{ marginTop: 14 }} />
        <Skeleton height={13} width="40%" style={{ marginTop: 8 }} />
        <Skeleton height={13} width="85%" style={{ marginTop: 8 }} />
      </div>
    ))}
  </div>
);

export default Skeleton;
