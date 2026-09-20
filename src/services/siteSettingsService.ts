import api from './api';
import { type SiteSettings, type SiteSettingsResponse } from '../types/siteSettings';

/**
 * Mutations for the site settings singleton.
 *
 * Reads deliberately live in redux/api/siteApi.ts instead: the settings are
 * needed by the footer on every page, so they go through the shared RTK Query
 * cache rather than a fetch per component.
 */
export const siteSettingsService = {
  // Full document including admin-only fields (admin).
  getAdminSettings: async (): Promise<SiteSettingsResponse> => {
    const response = await api.get('/admin/site-settings');
    return response.data;
  },

  // Partial update — omitted fields keep their stored value (admin).
  updateSettings: async (data: Partial<SiteSettings>): Promise<SiteSettingsResponse> => {
    const response = await api.put('/admin/site-settings', data);
    return response.data;
  },
};
