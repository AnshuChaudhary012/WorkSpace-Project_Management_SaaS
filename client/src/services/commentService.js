import api from './api';

export const commentService = {
  getComments: async (taskId) => {
    const res = await api.get(`/tasks/${taskId}/comments`);
    return res.data || [];
  },

  createComment: async (taskId, content) => {
    const res = await api.post(`/tasks/${taskId}/comments`, { content });
    return res.data;
  },

  deleteComment: async (taskId, commentId) => {
    const res = await api.del(`/tasks/${taskId}/comments/${commentId}`);
    return res;
  }
};

export default commentService;
