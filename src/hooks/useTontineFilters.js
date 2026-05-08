
import { useState, useMemo } from 'react';

export const useTontineFilters = (initialTontines = []) => {
  const [tontines, setTontines] = useState(initialTontines);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('newest'); // newest, distance, popularity

  const filteredAndSortedTontines = useMemo(() => {
    let result = [...tontines];

    // Search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.nom.toLowerCase().includes(query) || 
        t.description?.toLowerCase().includes(query)
      );
    }

    // Filter by type
    if (filterType !== 'all') {
      result = result.filter(t => t.type === filterType);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created) - new Date(a.created);
      }
      if (sortBy === 'popularity') {
        return (b.nombre_membres_max || 0) - (a.nombre_membres_max || 0);
      }
      if (sortBy === 'distance') {
        // Simulated distance sorting (using ID hash to mock random stable distance)
        const getDist = (str) => String(str).charCodeAt(0);
        return getDist(a.id) - getDist(b.id);
      }
      return 0;
    });

    return result;
  }, [tontines, searchQuery, filterType, sortBy]);

  return {
    tontines,
    setTontines,
    searchQuery,
    setSearchQuery,
    filterType,
    setFilterType,
    sortBy,
    setSortBy,
    filteredTontines: filteredAndSortedTontines
  };
};
