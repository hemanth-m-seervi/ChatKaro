import { useGroupStore } from "../store/useGroupStore";
import { useEffect, useRef, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { formatMessageTime } from "../lib/utils";
import { Send, Image as ImageIcon, X } from "lucide-react";
import EditGroupModal from "./EditGroupModal";
import toast from "react-hot-toast";

const GroupChatContainer = () => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const {
    selectedGroup,
    groupMessages,
    getGroupMessages,
    sendGroupMessage,
    markGroupMessagesAsRead,
    isGroupMessagesLoading,
  } = useGroupStore();
  const { authUser } = useAuthStore();
  const [message, setMessage] = useState("");
  const [image, setImage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messageEndRef = useRef(null);

  useEffect(() => {
    if (selectedGroup?._id) {
      getGroupMessages(selectedGroup._id);
      markGroupMessagesAsRead(selectedGroup._id);
    }
  }, [selectedGroup?._id, getGroupMessages, markGroupMessagesAsRead]);

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [groupMessages, showMembersModal, isSending]);

  const handleSendMessage = async () => {
    if (!message.trim() && !image) return;

    setIsSending(true);
    try {
      await sendGroupMessage({
        text: message.trim(),
        image,
      });
      setMessage("");
      setImage("");
    } catch (error) {
      toast.error("Failed to send message. Please try again.");
      console.error("Error sending group message:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size should be less than 5MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        setImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => setImage("");

  if (!selectedGroup) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-zinc-500">
          <div className="text-6xl mb-4">👥</div>
          <h3 className="text-xl font-medium mb-2">Select a Group</h3>
          <p>Choose a group to start chatting</p>
        </div>
      </div>
    );
  }

  if (isGroupMessagesLoading) {
    return (
      <div className="flex-1 flex flex-col">
        <div className="p-2.5 border-b border-base-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="avatar">
                <div className="size-10 rounded-full">
                  <img
                    src={selectedGroup.avatar || "/avatar.png"}
                    alt={selectedGroup.name}
                    className="object-cover"
                  />
                </div>
              </div>
              <div>
                <h3 className="font-medium">{selectedGroup.name}</h3>
              </div>
            </div>
            <p className="text-sm text-zinc-500 whitespace-nowrap">
              {selectedGroup.members.length} members
            </p>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <div className="p-2.5 border-b border-base-300">
        <div className="flex items-center justify-between">
          {/* Left: Avatar & Info */}
          <div className="flex items-center gap-3">
            <div className="avatar">
              <div className="size-10 rounded-full">
                <img
                  src={selectedGroup.avatar || "/avatar.png"}
                  alt={selectedGroup.name}
                  className="object-cover"
                />
              </div>
            </div>
            <div>
              <h3 className="font-medium">{selectedGroup.name}</h3>
              {selectedGroup.description && (
                <p className="text-sm text-base-content/70">
                  {selectedGroup.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowMembersModal((prev) => !prev)}
                className="p-1 rounded hover:bg-base-300"
                title="Show Members"
              >
                <img
                  src="/members.png"
                  alt="Group Members"
                  className="size-5 object-contain"
                  style={{ filter: "invert(0.6)" }}
                />
              </button>
              {showMembersModal && (
                <div className="absolute right-0 mt-2 w-64 bg-base-100 border border-base-300 rounded-lg shadow-lg z-50">
                  <div className="p-3 max-h-56 overflow-y-auto">
                    <h3 className="text-base font-semibold mb-2">
                      {selectedGroup.members.length} members
                    </h3>
                    {selectedGroup.members.length > 0 ? (
                      selectedGroup.members.map((member) => (
                        <div
                          key={member.user._id || member.user}
                          className="flex items-center gap-3 border-b pb-2 mb-2 last:border-b-0 last:mb-0"
                        >
                          <img
                            src={member.user.profilePic || "/avatar.png"}
                            alt={member.user.fullName || "Member"}
                            className="w-8 h-8 rounded-full object-cover border"
                          />
                          <div className="flex-1">
                            <div className="font-medium text-sm">
                              {member.user.fullName || member.user}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-zinc-500">
                        No members found.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowEditModal(true)}
              className="p-1 rounded hover:bg-base-300"
              title="Edit Group"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="size-5 text-zinc-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 20h9"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16.5 3.5a2.121 2.121 0 113 3L7 19l-4 1 1-4 12.5-12.5z"
                />
              </svg>
            </button>

            <button
              onClick={() => useGroupStore.getState().setSelectedGroup(null)}
              className="p-1 rounded hover:bg-base-300"
              title="Close Chat"
            >
              <X className="size-5 text-zinc-500" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {groupMessages.map((msg, idx) => (
          <div
            key={msg._id}
            className={`chat ${
              msg.senderId._id === authUser._id ? "chat-end" : "chat-start"
            }`}
            ref={idx === groupMessages.length - 1 ? messageEndRef : null}
          >
            <div className="chat-image avatar">
              <div className="size-10 rounded-full border">
                <img
                  src={msg.senderId.profilePic || "/avatar.png"}
                  alt="profile"
                />
              </div>
            </div>
            <div className="chat-header mb-1">
              <span className="text-sm font-medium">
                {msg.senderId._id === authUser._id
                  ? "You"
                  : msg.senderId.fullName}
              </span>
              <time className="text-xs opacity-50 ml-1">
                {formatMessageTime(msg.createdAt)}
              </time>
            </div>
            <div
              className={`chat-bubble flex flex-col ${
                msg.senderId._id === authUser._id
                  ? "bg-primary text-primary-content"
                  : "bg-base-200 text-base-content"
              }`}
            >
              {msg.image && (
                <img
                  src={msg.image}
                  alt="Attachment"
                  className="sm:max-w-[200px] rounded-md mb-2"
                />
              )}
              {msg.text && <p>{msg.text}</p>}
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-base-300">
        {image && (
          <div className="relative mb-2 w-fit max-w-xs">
            <img
              src={image}
              alt="Preview"
              className="h-24 rounded-md object-contain"
            />
            <button
              onClick={removeImage}
              className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
            >
              <X className="size-4" />
            </button>
          </div>
        )}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 text-sm bg-base-200 border border-base-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
            disabled={isSending}
          />
          <label className="cursor-pointer p-2 hover:bg-base-300 rounded-md">
            <ImageIcon className="size-4" />
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </label>
          <button
            onClick={handleSendMessage}
            disabled={isSending || (!message.trim() && !image)}
            className="p-2 bg-primary text-primary-content rounded-md hover:bg-primary/90 transition disabled:opacity-50"
          >
            <Send className="size-4" />
          </button>
        </div>
      </div>

      <EditGroupModal
        group={selectedGroup}
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
      />
    </div>
  );
};

export default GroupChatContainer;
