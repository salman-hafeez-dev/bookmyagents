import React, { useState } from 'react';
import { type Service } from '../../types/service';
import { CardSkeleton } from '../dashboard-admin/Skeleton';
import ConfirmationModal from './ConfirmationModal';

interface ServiceListProps {
  services: Service[];
  onEdit: (service: Service) => void;
  onDelete: (serviceId: string) => void;
  isLoading?: boolean;
}

const ServiceList: React.FC<ServiceListProps> = ({ services, onEdit, onDelete, isLoading = false }) => {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const handleDeleteClick = (serviceId: string) => {
    setDeleteConfirm(serviceId);
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirm) {
      onDelete(deleteConfirm);
      setDeleteConfirm(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirm(null);
  };

  const getCategoryBadgeClass = (category: string) => {
    const categoryClasses: Record<string, string> = {
      accommodation: 'bg-primary',
      transportation: 'bg-info',
      tours: 'bg-success',
      food: 'bg-warning',
      entertainment: 'bg-danger',
      shopping: 'bg-secondary',
      other: 'bg-dark',
    };
    return categoryClasses[category] || 'bg-secondary';
  };

  const formatCategory = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  if (isLoading) {
    return <CardSkeleton count={6} />;
  }

  if (services.length === 0) {
    return (
      <div className="text-center py-5">
        <div className="empty-state">
          <i className="fas fa-box-open fa-3x text-muted mb-3"></i>
          <h5 className="text-muted">No Services Found</h5>
          <p className="text-muted">You haven't created any services yet. Click "Create Service" to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="service-list">
      <div className="row">
        {services.map((service) => (
          <div key={service._id} className="col-xl-4 col-lg-6 col-md-6 col-sm-12 mb-4">
            <div className="service-card h-100">
              <div className="card">
                {/* Service Images */}
                <div className="service-images">
                  {service.pictures && service.pictures.length > 0 ? (
                    <div id={`carousel-${service._id}`} className="carousel slide" data-bs-ride="carousel">
                      <div className="carousel-inner">
                        {service.pictures.map((picture, index) => (
                          <div
                            key={index}
                            className={`carousel-item ${index === 0 ? 'active' : ''}`}
                          >
                            <img
                              src={picture}
                              className="d-block w-100 service-image"
                              alt={`${service.title} - Image ${index + 1}`}
                              style={{ 
                                height: '200px', 
                                objectFit: 'cover',
                                width: '100%',
                                borderRadius: '8px 8px 0 0'
                              }}
                            />
                          </div>
                        ))}
                      </div>
                      {service.pictures.length > 1 && (
                        <>
                          <button
                            className="carousel-control-prev"
                            type="button"
                            data-bs-target={`#carousel-${service._id}`}
                            data-bs-slide="prev"
                          >
                            <span className="carousel-control-prev-icon" aria-hidden="true"></span>
                            <span className="visually-hidden">Previous</span>
                          </button>
                          <button
                            className="carousel-control-next"
                            type="button"
                            data-bs-target={`#carousel-${service._id}`}
                            data-bs-slide="next"
                          >
                            <span className="carousel-control-next-icon" aria-hidden="true"></span>
                            <span className="visually-hidden">Next</span>
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="no-image-placeholder">
                      <img
                        src="/assets/img/placeholder/placeholder.png"
                        className="d-block w-100 service-image"
                        alt="No image available"
                        style={{ 
                          height: '200px', 
                          objectFit: 'cover',
                          width: '100%',
                          borderRadius: '8px 8px 0 0'
                        }}
                        onError={(e) => {
                          // Fallback to icon if placeholder image fails to load
                          e.currentTarget.style.display = 'none';
                          const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                          if (fallback) {
                            fallback.style.display = 'flex';
                          }
                        }}
                      />
                      <div className="no-image-fallback" style={{ display: 'none', height: '200px', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8f9fa' }}>
                        <i className="fas fa-image fa-3x text-muted"></i>
                        <p className="text-muted mt-2">No images</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="card-body">
                  {/* Service Header */}
                  <div className="service-header mb-3">
                    <div className="d-flex justify-content-between align-items-start">
                      <h5 className="service-title mb-1">{service.title}</h5>
                      <span className={`badge ${getCategoryBadgeClass(service.category)}`}>
                        {formatCategory(service.category)}
                      </span>
                    </div>
                    <div className="service-price">
                      <span className="price-amount">${service.price.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Service Description */}
                  <div className="service-description mb-3">
                    <div 
                      className="text-muted small"
                      dangerouslySetInnerHTML={{
                        __html: (() => {
                          // Strip HTML tags for length calculation
                          const textContent = service.description.replace(/<[^>]*>/g, '');
                          const maxLength = window.innerWidth < 768 ? 80 : 100;
                          
                          if (textContent.length > maxLength) {
                            // Find the last complete word within the limit
                            const truncated = textContent.substring(0, maxLength);
                            const lastSpaceIndex = truncated.lastIndexOf(' ');
                            const finalText = lastSpaceIndex > 0 
                              ? truncated.substring(0, lastSpaceIndex) 
                              : truncated;
                            
                            // Return the truncated text with ellipsis
                            return `${finalText}...`;
                          }
                          
                          return service.description;
                        })()
                      }}
                    />
                  </div>

                  {/* Service Location */}
                  <div className="service-location mb-3">
                    <div className="location-info">
                      <i className="fas fa-map-marker-alt text-primary me-2"></i>
                      <span className="small text-muted">
                        {service.location.city}, {service.location.state}, {service.location.country}
                      </span>
                    </div>
                  </div>

                  {/* Contact Information */}
                  <div className="service-contact mb-3">
                    <div className="contact-item mb-1">
                      <i className="fas fa-phone text-success me-2"></i>
                      <span className="small">{service.contactDetails.phone}</span>
                    </div>
                    <div className="contact-item mb-1">
                      <i className="fas fa-envelope text-info me-2"></i>
                      <span className="small">{service.contactDetails.email}</span>
                    </div>
                    <div className="contact-item">
                      <i className="fas fa-globe text-warning me-2"></i>
                      <a 
                        href={service.contactDetails.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="small text-decoration-none"
                      >
                        {service.contactDetails.website}
                      </a>
                    </div>
                  </div>

                  {/* Service Meta */}
                  <div className="service-meta mb-3">
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted">
                        Created: {service.createdAt ? new Date(service.createdAt).toLocaleDateString() : 'N/A'}
                      </small>
                      <small className="text-muted">
                        Updated: {service.updatedAt ? new Date(service.updatedAt).toLocaleDateString() : 'N/A'}
                      </small>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="card-footer bg-transparent">
                  <div className="d-flex justify-content-between flex-wrap gap-2">
                    <button
                      className="btn btn-outline-primary btn-sm flex-fill"
                      onClick={() => onEdit(service)}
                    >
                      <i className="fas fa-edit me-1"></i>
                      <span className="d-none d-sm-inline">Edit</span>
                    </button>
                    <button
                      className="btn btn-outline-danger btn-sm flex-fill"
                      onClick={() => handleDeleteClick(service._id!)}
                    >
                      <i className="fas fa-trash me-1"></i>
                      <span className="d-none d-sm-inline">Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Delete Confirmation */}
      <ConfirmationModal
        isOpen={!!deleteConfirm}
        title="Delete Service"
        heading="Permanent Deletion"
        description="This service and its images will be removed from your listings and can no longer be found by travellers."
        icon="error"
        actionColor="danger"
        actionLabel="Delete Service"
        dangerZone
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
};

export default ServiceList;
