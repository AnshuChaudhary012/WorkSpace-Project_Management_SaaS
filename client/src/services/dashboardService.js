import api from './api';

export const dashboardService = {
  getDashboardMetrics: async (workspaceId) => {
    const res = await api.get(`/workspaces/${workspaceId}/dashboard`);
    return res.data;
  }
};

export default dashboardService;
