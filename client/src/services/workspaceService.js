import api from './api';

export const workspaceService = {
  getWorkspaces: async () => {
    const res = await api.get('/workspaces');
    return res.data || [];
  },

  createWorkspace: async (data) => {
    const res = await api.post('/workspaces', data);
    return res.data;
  },

  getWorkspaceById: async (workspaceId) => {
    const res = await api.get(`/workspaces/${workspaceId}`);
    return res.data;
  },

  updateWorkspace: async (workspaceId, data) => {
    const res = await api.patch(`/workspaces/${workspaceId}`, data);
    return res.data;
  },

  deleteWorkspace: async (workspaceId) => {
    const res = await api.del(`/workspaces/${workspaceId}`);
    return res;
  }
};

export default workspaceService;
