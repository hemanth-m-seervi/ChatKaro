import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useGroupStore = create((set, get) => ({
  updateGroup: async (groupId, data) => {
    try {
      const res = await axiosInstance.put(`/groups/${groupId}`, data);
      const updatedGroup = res.data;
      const { groups } = get();
      const updatedGroups = groups.map((group) =>
        group._id === groupId ? updatedGroup : group
      );
      set({ groups: updatedGroups, selectedGroup: updatedGroup });
      toast.success("Group updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update group");
    }
  },
  deleteGroup: async (groupId) => {
    try {
      await axiosInstance.delete(`/groups/${groupId}`);

      const { groups } = get();
      const updatedGroups = groups.filter((group) => group._id !== groupId);
      set({ groups: updatedGroups, selectedGroup: null });
      toast.success("Group deleted successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete group");
    }
  },
  groups: [],
  selectedGroup: null,
  groupMessages: [],
  isGroupsLoading: false,
  isGroupMessagesLoading: false,

  getGroups: async () => {
    set({ isGroupsLoading: true });
    try {
      const res = await axiosInstance.get("/groups");
      set({ groups: res.data });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load groups");
    } finally {
      set({ isGroupsLoading: false });
    }
  },

  getGroupMessages: async (groupId) => {
    set({ isGroupMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/groups/${groupId}/messages`);
      set({ groupMessages: res.data });
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to load group messages"
      );
    } finally {
      set({ isGroupMessagesLoading: false });
    }
  },

  createGroup: async (groupData) => {
    try {
      const res = await axiosInstance.post("/groups/create", groupData);
      const newGroup = res.data;
      set((state) => ({
        groups: [newGroup, ...state.groups],
      }));
      toast.success("Group created successfully");
      return newGroup;
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create group");
      throw error;
    }
  },

  sendGroupMessage: async (messageData) => {
    const { selectedGroup, groupMessages } = get();
    try {
      const res = await axiosInstance.post(
        `/groups/${selectedGroup._id}/messages`,
        messageData
      );
      set({ groupMessages: [...groupMessages, res.data] });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  },

  markGroupMessagesAsRead: async (groupId) => {
    try {
      await axiosInstance.put(`/groups/${groupId}/messages/read`);

      const { groups } = get();
      const updatedGroups = groups.map((group) =>
        group._id === groupId ? { ...group, unseenCount: 0 } : group
      );
      set({ groups: updatedGroups });
    } catch (error) {
      console.error("Error marking group messages as read:", error);
    }
  },

  leaveGroup: async (groupId) => {
    try {
      await axiosInstance.post(`/groups/${groupId}/leave`);
      const { groups } = get();
      const updatedGroups = groups.filter((group) => group._id !== groupId);
      set({ groups: updatedGroups, selectedGroup: null });
      toast.success("Left group successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to leave group");
    }
  },

  addMemberToGroup: async (groupId, memberId) => {
    try {
      const res = await axiosInstance.post(`/groups/${groupId}/members`, {
        memberId,
      });
      const updatedGroup = res.data;
      const { groups } = get();
      const updatedGroups = groups.map((group) =>
        group._id === groupId ? updatedGroup : group
      );
      set({ groups: updatedGroups });
      if (get().selectedGroup?._id === groupId) {
        set({ selectedGroup: updatedGroup });
      }
      toast.success("Member added successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add member");
    }
  },

  removeMemberFromGroup: async (groupId, memberId) => {
    try {
      const res = await axiosInstance.delete(
        `/groups/${groupId}/members/${memberId}`
      );
      const updatedGroup = res.data;
      const { groups } = get();
      const updatedGroups = groups.map((group) =>
        group._id === groupId ? updatedGroup : group
      );
      set({ groups: updatedGroups });
      if (get().selectedGroup?._id === groupId) {
        set({ selectedGroup: updatedGroup });
      }
      toast.success("Member removed successfully");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to remove member");
    }
  },

  subscribeToGroupMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (!socket) return;

    socket.on("newGroupMessage", (newMessage) => {
      const { selectedGroup, groupMessages } = get();
      const { authUser } = useAuthStore.getState();

      if (newMessage.senderId._id === authUser._id) return;

      if (selectedGroup && newMessage.groupId === selectedGroup._id) {
        const alreadyExists = groupMessages.some(
          (msg) => msg._id === newMessage._id
        );
        if (!alreadyExists) {
          set({ groupMessages: [...groupMessages, newMessage] });
        }
      }
      const { groups } = get();

      const updatedGroups = groups.map((group) => {
        if (group._id === newMessage.groupId) {
          if (selectedGroup && selectedGroup._id === newMessage.groupId) {
            return { ...group, unseenCount: 0 };
          }

          const prevUnseenCount = group.unseenCount || 0;
          const alreadyExists = groupMessages.some(
            (msg) => msg._id === newMessage._id
          );
          if (
            !alreadyExists &&
            newMessage.senderId._id !== authUser._id &&
            prevUnseenCount === group.unseenCount
          ) {
            return { ...group, unseenCount: prevUnseenCount + 1 };
          }
        }
        return group;
      });
      set({ groups: updatedGroups });
    });

    socket.on("groupCreated", (newGroup) => {
      const { groups } = get();

      const isMember = newGroup.members.some(
        (m) => m.user === useAuthStore.getState().authUser?._id
      );
      if (isMember) {
        set({ groups: [newGroup, ...groups] });
        toast.success(`You've been added to a new group: ${newGroup.name}`);
      }
    });
  },

  unsubscribeFromGroupMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      socket.off("newGroupMessage");
      socket.off("groupCreated");
    }
  },

  setSelectedGroup: (selectedGroup) => set({ selectedGroup }),
}));
