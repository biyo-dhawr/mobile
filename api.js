export const API_URL = 'http://192.168.8.109:4000/api';

export async function apiRequest(path, options = {}) {
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Cilad ayaa dhacday');
    }

    return data;
  } catch (error) {
    console.error(`API Error on ${path}:`, error);
    throw error;
  }
}

// Fetch all regions
export async function getRegions() {
  return await apiRequest('/regions');
}

// Fetch districts by regionId
export async function getDistricts(regionId) {
  return await apiRequest(`/districts?regionId=${regionId}`);
}

// Fetch villages by districtId
export async function getVillages(districtId) {
  return await apiRequest(`/villages?districtId=${districtId}`);
}

// Fetch water sources for a specific village
export async function getWaterSources(villageId) {
  const result = await apiRequest(`/water-sources?villageId=${villageId}&limit=20`);
  return result.data || [];
}

// Submit a public report
export async function submitPublicReport(villageId, waterSourceId, content, sourceStatus, sourceWaterLevel) {
  return await apiRequest('/reports/submit/public', {
    method: 'POST',
    body: JSON.stringify({
      villageId,
      waterSourceId,
      content,
      reporterType: 'App',
      sourceStatus,
      sourceWaterLevel,
    }),
  });
}
