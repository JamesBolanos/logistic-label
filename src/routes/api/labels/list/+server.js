// src/routes/api/labels/list/+server.js
import { json } from '@sveltejs/kit';
import { getLabelsByUser, searchLabels } from '$lib/server/db/labels';

export async function GET({ url, locals }) {
  const user = locals.user;
  if (!user) {
    return json({ success: false, message: 'Authentication required' }, { status: 401 });
  }
  
  try {
    // Get query parameters
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('search') || '';
    
    // Validate page and limit
    if (isNaN(page) || page < 1) {
      return json({ success: false, message: 'Invalid page number' }, { status: 400 });
    }
    
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return json({ success: false, message: 'Invalid limit' }, { status: 400 });
    }
    
    // Get labels
    let result;
    
    if (search) {
      result = await searchLabels(user.id, search, page, limit);
    } else {
      result = await getLabelsByUser(user.id, page, limit);
    }
    
    return json({ 
      success: true,
      labels: result.labels,
      pagination: result.pagination
    });
  } catch (error) {
    console.error('Label listing error:', error);
    
    return json(
      { 
        success: false, 
        message: 'Failed to fetch labels. Please try again.' 
      }, 
      { status: 500 }
    );
  }
}
