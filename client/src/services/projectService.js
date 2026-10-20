import api from './api';

export const projectService = {
  getProjects: async (workspaceId) => {
    const res = await api.get(`/workspaces/${workspaceId}/projects`);
    return res.data || [];
  },

  createProject: async (workspaceId, data) => {
    const res = await api.post(`/workspaces/${workspaceId}/projects`, data);
    return res.data;
  },

  getProjectById: async (projectId) => {
    const res = await api.get(`/projects/${projectId}`);
    return res.data;
  },

  updateProject: async (projectId, data) => {
    const res = await api.patch(`/projects/${projectId}`, data);
    return res.data;
  },

  deleteProject: async (projectId) => {
    const res = await api.del(`/projects/${projectId}`);
    return res;
  }
};

export default projectService;
