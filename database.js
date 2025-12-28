// Supabase configuration
const SUPABASE_URL = 'https://cxjfqwnmabyabhjhadjy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4amZxd25tYWJ5YWJoamhhZGp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU5Njc2NDUsImV4cCI6MjA3MTU0MzY0NX0.qbI-CU_wgAioBihGx54RXpr4cBryhzIjc4C8iT5YAX0';

// Initialize Supabase client immediately
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Generic fetch function for any table
async function fetchTableData(tableName, filters = {}, orderBy = null) {
  try {
    let query = supabaseClient.from(tableName).select('*');
    
    // Apply filters
    for (const [key, value] of Object.entries(filters)) {
      if (value !== null && value !== '' && value !== 'all') {
        query = query.eq(key, value);
      }
    }
    
    // Apply ordering
    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending });
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}

// Search function for array columns (like aaroh, avaroh, scale)
async function searchInArrayColumn(tableName, columnName, searchValue) {
  try {
    const { data, error } = await supabaseClient
      .from(tableName)
      .select('*');
    
    if (error) throw error;
    
    // Filter locally since Supabase array search requires specific syntax
    const searchNum = parseInt(searchValue);
    if (!isNaN(searchNum)) {
      return data.filter(row => {
        const arr = row[columnName];
        return arr && Array.isArray(arr) && arr.includes(searchNum);
      });
    }
    
    return data;
  } catch (error) {
    console.error('Error searching data:', error);
    throw error;
  }
}

// Combined search and filter function
async function fetchFilteredData(tableName, options = {}) {
  const { search, filters, orderBy } = options;
  
  try {
    let data;
    
    // If searching in array column
    if (search && search.column && search.value) {
      data = await searchInArrayColumn(tableName, search.column, search.value);
      
      // Apply additional filters to search results
      if (filters && Object.keys(filters).length > 0) {
        for (const [key, value] of Object.entries(filters)) {
          if (value !== null && value !== '' && value !== 'all') {
            data = data.filter(row => row[key] == value);
          }
        }
      }
    } else {
      // Regular fetch with filters
      data = await fetchTableData(tableName, filters, orderBy);
    }
    
    // Apply ordering if needed and not already done
    if (orderBy && search && search.column) {
      // Manual sort for search results
      data.sort((a, b) => {
        const aVal = a[orderBy.column];
        const bVal = b[orderBy.column];
        if (aVal === null) return 1;
        if (bVal === null) return -1;
        if (aVal < bVal) return orderBy.ascending ? -1 : 1;
        if (aVal > bVal) return orderBy.ascending ? 1 : -1;
        return 0;
      });
    }
    
    return data;
  } catch (error) {
    console.error('Error in fetchFilteredData:', error);
    throw error;
  }
}

// Export to window for global access
window.fetchTableData = fetchTableData;
window.searchInArrayColumn = searchInArrayColumn;
window.fetchFilteredData = fetchFilteredData;