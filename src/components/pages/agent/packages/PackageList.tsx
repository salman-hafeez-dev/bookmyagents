import React from 'react';
import { type TravelPackage } from '../../../../types/package';
import { Badge, Button, DataTable, IconButton, type DataTableColumn } from '../../../ui';

interface PackageListProps {
  packages: TravelPackage[];
  isLoading: boolean;
  onEdit: (travelPackage: TravelPackage) => void;
  onDelete: (travelPackage: TravelPackage) => void;
  onToggleActive: (travelPackage: TravelPackage) => void;
  onCreate: () => void;
  /** Category/visibility filters, rendered beside the table's search box. */
  toolbar?: React.ReactNode;
}

const formatPrice = (travelPackage: TravelPackage) => {
  const amount = new Intl.NumberFormat('en-PK').format(travelPackage.price);
  const suffix = travelPackage.priceType === 'per_group' ? 'per group' : 'per person';
  return `${travelPackage.currency} ${amount} ${suffix}`;
};

const formatDeparture = (travelPackage: TravelPackage) => {
  if (!travelPackage.departureDate) return 'On request';
  return new Date(travelPackage.departureDate).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

const categoryName = (travelPackage: TravelPackage) =>
  typeof travelPackage.category === 'string' ? '' : travelPackage.category?.name || '';

/**
 * The agent's packages.
 *
 * Previously a grid of cards. A card per package reads nicely at five and
 * poorly at fifty: no sorting, no search, no paging, and comparing the price or
 * departure date of two packages meant scanning across three columns of
 * differently sized boxes. As a table the same fields line up, and it picks up
 * search and pagination from DataTable for free.
 *
 * The cover image survives as a thumbnail in the title cell, which is what it
 * was actually doing for recognition.
 */
const PackageList: React.FC<PackageListProps> = ({
  packages,
  isLoading,
  onEdit,
  onDelete,
  onToggleActive,
  onCreate,
  toolbar,
}) => {
  const columns: DataTableColumn<TravelPackage>[] = [
    {
      key: 'package',
      header: 'Package',
      render: (travelPackage) => (
        <div className="d-flex align-items-center gap-3">
          <img
            src={travelPackage.images[0]?.url || '/assets/img/placeholder/placeholder.png'}
            alt=""
            className="rounded flex-shrink-0"
            style={{ width: 56, height: 42, objectFit: 'cover' }}
            loading="lazy"
          />
          <div>
            <div className="fw-semibold">{travelPackage.title}</div>
            <small className="text-muted">
              {travelPackage.departureCity} → {travelPackage.destination} · {travelPackage.durationDays} days
            </small>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      nowrap: true,
      hideBelow: 'lg',
      render: (travelPackage) => {
        const name = categoryName(travelPackage);
        return name ? <Badge tone="neutral">{name}</Badge> : <span className="text-muted">—</span>;
      },
    },
    {
      key: 'price',
      header: 'Price',
      nowrap: true,
      render: (travelPackage) => formatPrice(travelPackage),
    },
    {
      key: 'departure',
      header: 'Departs',
      nowrap: true,
      hideBelow: 'md',
      render: (travelPackage) => (
        <span className="text-muted">{formatDeparture(travelPackage)}</span>
      ),
    },
    {
      key: 'views',
      header: 'Views',
      align: 'center',
      nowrap: true,
      hideBelow: 'lg',
      render: (travelPackage) => (
        <span className="text-muted">
          {typeof travelPackage.viewCount === 'number' ? travelPackage.viewCount : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      nowrap: true,
      render: (travelPackage) => (travelPackage.isActive
        ? <Badge tone="success" dot>Live</Badge>
        : <Badge tone="neutral" dot>Hidden</Badge>),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      width: '132px',
      render: (travelPackage) => (
        <div className="ui-actions">
          <IconButton
            icon="far fa-pen-to-square"
            label="Edit package"
            onClick={() => onEdit(travelPackage)}
          />
          <IconButton
            icon={travelPackage.isActive ? 'far fa-eye-slash' : 'far fa-eye'}
            label={travelPackage.isActive ? 'Hide from the marketplace' : 'Show on the marketplace'}
            tone={travelPackage.isActive ? 'warning' : 'success'}
            onClick={() => onToggleActive(travelPackage)}
          />
          <IconButton
            icon="far fa-trash-can"
            label="Delete package"
            tone="danger"
            onClick={() => onDelete(travelPackage)}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="dashboard-card">
      <div className="card-body">
        <DataTable<TravelPackage>
          columns={columns}
          rows={packages}
          rowKey={(travelPackage) => travelPackage._id}
          title="My Packages"
          loading={isLoading}
          search={{ placeholder: 'Search by title or destination…', keys: ['title', 'destination', 'departureCity'] }}
          actions={<Button icon="fas fa-plus" size="sm" onClick={onCreate}>Add package</Button>}
          toolbar={toolbar}
          pagination={{ noun: 'packages' }}
          emptyState={{
            icon: 'fas fa-suitcase-rolling',
            title: 'No packages yet',
            description: 'A package is what customers actually search for and compare — your profile on its own gives them nothing to book.',
            action: <Button onClick={onCreate}>Add your first package</Button>,
          }}
        />
      </div>
    </div>
  );
};

export default PackageList;
