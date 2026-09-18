import { useEffect, useState } from 'react';
import { type Category } from '../types/category';
import { categoryService } from '../services/categoryService';

// The public category list is small, fixed and needed by three components on
// the same screen — the search bar, the filter sidebar and the homepage cards.
// One in-flight promise is shared between them so a page load makes a single
// request instead of one per component.
//
// Deliberately not added to categoryService itself: the admin screens create
// and edit categories and must keep seeing fresh data.
let cached: Promise<Category[]> | null = null;

const loadCategories = (): Promise<Category[]> => {
  if (!cached) {
    cached = categoryService
      .getCategories({ limit: 20 })
      .then((response) => response.data || [])
      .catch((error) => {
        // Never cache a failure — the next mount should be able to retry.
        cached = null;
        console.error('Failed to load categories:', error);
        return [];
      });
  }
  return cached;
};

export const useCategories = (): Category[] => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    let cancelled = false;
    loadCategories().then((list) => {
      if (!cancelled) setCategories(list);
    });
    return () => { cancelled = true; };
  }, []);

  return categories;
};

export default useCategories;
