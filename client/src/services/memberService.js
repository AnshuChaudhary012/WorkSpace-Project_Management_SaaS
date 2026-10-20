import api from './api';

export const memberService = {
  getMembers: async (workspaceId) => {
    const res = await api.get(`/workspaces/${workspaceId}/members`);
    return res.data || [];
  },

  addMember: async (workspaceId, data) => {
    const res = await api.post(`/workspaces/${workspaceId}/members`, data);
    return res.data;
  },

  updateMemberRole: async (workspaceId, memberId, role) => {
    const res = await api.patch(`/workspaces/${workspaceId}/members/${memberId}`, { role });
    return res.data;
  },

  removeMember: async (workspaceId, memberId) => {
    const res = await api.del(`/workspaces/${workspaceId}/members/${memberId}`);
    return res;
  }
};

export default memberService;
