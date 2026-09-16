import React from 'react';
import { type PaymentStatus } from '../../types/payment';

const VARIANTS: Record<PaymentStatus, string> = {
  pending: 'bg-warning text-dark',
  verified: 'bg-success',
  rejected: 'bg-danger',
};

const PaymentStatusBadge: React.FC<{ status: PaymentStatus }> = ({ status }) => (
  <span className={`badge ${VARIANTS[status] || 'bg-secondary'}`}>{status}</span>
);

export default PaymentStatusBadge;
