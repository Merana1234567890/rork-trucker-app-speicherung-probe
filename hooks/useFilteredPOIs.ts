import { useMemo, useState, useCallback } from 'react';
import { usePOI } from '@/hooks/usePOI';
import { POIFilter, POIType, POIWithDistance } from '@/types';
import { SEARCH_DEBOUNCE_MS } from '@/constants/poi';

export function useFilteredPOIs() {
  const { getPOIsWithDistance } = usePOI();
  const [filter, setFilter] = useState<POIFilter>({
    types: [],
    favoriteOnly: false,
    minRating: null,
    tags: [],
    searchQuery: ''
  });

  const filteredPOIs = useMemo(() => {
    let result = getPOIsWithDistance;

    // Filter by types
    if (filter.types.length > 0) {
      result = result.filter(poi => filter.types.includes(poi.type));
    }

    // Filter by favorite
    if (filter.favoriteOnly) {
      result = result.filter(poi => poi.favorite);
    }

    // Filter by minimum rating
    if (filter.minRating !== null) {
      result = result.filter(poi => poi.rating !== null && poi.rating >= filter.minRating!);
    }

    // Filter by tags
    if (filter.tags.length > 0) {
      result = result.filter(poi => 
        filter.tags.some(tag => 
          poi.tags.some(poiTag => 
            poiTag.toLowerCase().includes(tag.toLowerCase())
          )
        )
      );
    }

    // Filter by search query
    if (filter.searchQuery.trim()) {
      const query = filter.searchQuery.toLowerCase().trim();
      result = result.filter(poi => 
        poi.name.toLowerCase().includes(query) ||
        poi.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return result;
  }, [getPOIsWithDistance, filter]);

  const updateFilter = useCallback((updates: Partial<POIFilter>) => {
    setFilter(prev => ({ ...prev, ...updates }));
  }, []);

  const clearFilter = useCallback(() => {
    setFilter({
      types: [],
      favoriteOnly: false,
      minRating: null,
      tags: [],
      searchQuery: ''
    });
  }, []);

  const toggleType = useCallback((type: POIType) => {
    setFilter(prev => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter(t => t !== type)
        : [...prev.types, type]
    }));
  }, []);

  const toggleTag = useCallback((tag: string) => {
    setFilter(prev => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter(t => t !== tag)
        : [...prev.tags, tag]
    }));
  }, []);

  const hasActiveFilters = useMemo(() => {
    return filter.types.length > 0 ||
           filter.favoriteOnly ||
           filter.minRating !== null ||
           filter.tags.length > 0 ||
           filter.searchQuery.trim() !== '';
  }, [filter]);

  return {
    filteredPOIs,
    filter,
    updateFilter,
    clearFilter,
    toggleType,
    toggleTag,
    hasActiveFilters
  };
}