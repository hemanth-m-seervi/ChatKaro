import { create } from "zustand";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import { useAuthStore } from "./useAuthStore";

export const useChatStore = create((set, get) => ({
  messages: [],
  users: [],
  selectedUser: null,
  isUsersLoading: false,
  isMessagesLoading: false,

  getUsers: async () => {
    set({ isUsersLoading: true });
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isUsersLoading: false });
    }
  },

  getMessages: async (userId) => {
    set({ isMessagesLoading: true });
    try {
      const res = await axiosInstance.get(`/messages/${userId}`);
      set({ messages: res.data });
    } catch (error) {
      toast.error(error.response.data.message);
    } finally {
      set({ isMessagesLoading: false });
    }
  },

  markMessagesAsRead: async (senderId) => {
    try {
      await axiosInstance.put(`/messages/read/${senderId}`);
     
      const { users } = get();
      const updatedUsers = users.map(user => 
        user._id === senderId ? { ...user, unseenCount: 0 } : user
      );
      set({ users: updatedUsers });
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  },

  refreshUsers: async () => {
    try {
      const res = await axiosInstance.get("/messages/users");
      set({ users: res.data });
    } catch (error) {
      console.error("Error refreshing users:", error);
    }
  },

  sendMessage: async (messageData) => {
    const { selectedUser, messages } = get();
    try {
      const res = await axiosInstance.post(`/messages/send/${selectedUser._id}`, messageData);
      set({ messages: [...messages, res.data] });
    } catch (error) {
      toast.error(error.response.data.message);
    }
  },

  subscribeToMessages: () => {
    const socket = useAuthStore.getState().socket;
    console.log("Setting up socket subscription, socket:", socket?.connected);
    
    if (!socket) {
      console.log("No socket available");
      return;
    }

    socket.on("newMessage", (newMessage) => {
      console.log("Received new message:", newMessage);
      const { authUser } = useAuthStore.getState();
      const { selectedUser, users } = get();
      
     
      if (newMessage.receiverId !== authUser._id) {
        console.log("Message not for current user");
        return;
      }

      const isMessageSentFromSelectedUser = newMessage.senderId === selectedUser?._id;
      console.log("Is message from selected user:", isMessageSentFromSelectedUser);
      
      
      if (isMessageSentFromSelectedUser) {
        console.log("Updating messages for selected user");
        set({
          messages: [...get().messages, newMessage],
        });
      }

      
      if (!isMessageSentFromSelectedUser) {
        console.log("Incrementing unseen count for user:", newMessage.senderId);
        const updatedUsers = users.map(user => 
          user._id === newMessage.senderId 
            ? { ...user, unseenCount: (user.unseenCount || 0) + 1 }
            : user
        );
        set({ users: updatedUsers });
      }
    });
  },

  unsubscribeFromMessages: () => {
    const socket = useAuthStore.getState().socket;
    if (socket) {
      console.log("Unsubscribing from messages");
      socket.off("newMessage");
    }
  },

  setSelectedUser: (selectedUser) => set({ selectedUser }),
}));