import api from './api';

export const taskService = {
  getTasks: async (projectId, params = {}) => {
    const query = new URLSearchParams();
    if (params.status) query.append('status', params.status);
    if (params.priority) query.append('priority', params.priority);
    if (params.assignee) query.append('assignee', params.assignee);
    if (params.search) query.append('search', params.search);

    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await api.get(`/projects/${projectId}/tasks${queryString}`);
    return res.data || [];
  },

  createTask: async (projectId, data) => {
    const res = await api.post(`/projects/${projectId}/tasks`, data);
    return res.data;
  },

  getTaskById: async (taskId) => {
    const res = await api.get(`/tasks/${taskId}`);
    return res.data;
  },

  updateTask: async (taskId, data) => {
    const res = await api.patch(`/tasks/${taskId}`, data);
    return res.data;
  },

  deleteTask: async (taskId) => {
    const res = await api.del(`/tasks/${taskId}`);
    return res;
  }
};

export default taskService;
