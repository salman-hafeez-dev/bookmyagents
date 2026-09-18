import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { type Category } from '../../types/category';
import { categoryService } from '../../services/categoryService';

// The five service categories as entry points, per the plan's homepage layout.
// Each card is a pre-filtered search rather than a page of its own, so there is
// only ever one results page to maintain.
const CategoryCards: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    categoryService
      .getCategories({ limit: 20 })
      .then((response) => {
        if (!cancelled) setCategories(response.data || []);
      })
      .catch((error) => console.error('Failed to load categories:', error))
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (isLoading || categories.length === 0) return null;

  return (
    <div className="tg-category-area pt-60 pb-60">
      <div className="container">
        <div className="row mb-40">
          <div className="col-12 text-center">
            <h2 className="tg-section-title">What are you looking for?</h2>
            <p className="text-muted">Find verified travel agents for the service you need.</p>
          </div>
        </div>

        <div className="row g-3">
          {categories.map((category) => (
            <div className="col-lg col-md-4 col-sm-6 col-12" key={category._id}>
              <Link
                to={`/search?type=packages&category=${category.slug}`}
                className="d-block h-100 p-4 text-center rounded border text-decoration-none tg-category-card"
              >
                <div className="mb-3">
                  <i className="fas fa-map-location-dot fa-2x text-primary"></i>
                </div>
                <h5 className="mb-2">{category.name}</h5>
                <p className="small text-muted mb-0">{category.description}</p>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryCards;
