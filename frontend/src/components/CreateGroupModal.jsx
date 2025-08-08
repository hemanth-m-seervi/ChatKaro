import { useState } from "react";
import { useGroupStore } from "../store/useGroupStore";
import { useChatStore } from "../store/useChatStore";
import { X, Users, Plus, Check } from "lucide-react";
import toast from "react-hot-toast";

const CreateGroupModal = ({ isOpen, onClose }) => {
  const { createGroup } = useGroupStore();
  const { users } = useChatStore();
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      alert("Please enter a group name");
      return;
    }

    if (selectedMembers.length === 0) {
      alert("Please select at least one member");
      return;
    }

    setIsCreating(true);
    try {
      await createGroup({
        name: groupName.trim(),
        description: description.trim(),
        memberIds: selectedMembers,
      });
      handleClose();
    } catch (error) {
      toast.error("Failed to create group. Please try again.");
      console.error("Error creating group:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setGroupName("");
    setDescription("");
    setSelectedMembers([]);
    setIsCreating(false);
    onClose();
  };

  const toggleMember = (userId) => {
    setSelectedMembers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{background: "rgba(255,255,255,0.6)", backdropFilter: "blur(8px)"}}>
      <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden">
        
        <div className="flex items-center justify-between p-4 border-b border-base-300">
          <h2 className="text-lg font-semibold">Create New Group</h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-base-300 rounded-full transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        
        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          
          <div>
            <label className="block text-sm font-medium mb-2">Group Name *</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Enter group name"
              className="w-full p-3 border border-base-300 rounded-lg bg-base-200 focus:outline-none focus:ring-2 focus:ring-primary"
              maxLength={50}
            />
          </div>

          
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter group description (optional)"
              className="w-full p-3 border border-base-300 rounded-lg bg-base-200 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              rows={3}
              maxLength={200}
            />
          </div>

          
          <div>
            <label className="block text-sm font-medium mb-2">
              Select Members ({selectedMembers.length} selected)
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {users.map((user) => (
                <button
                  key={user._id}
                  onClick={() => toggleMember(user._id)}
                  className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                    selectedMembers.includes(user._id)
                      ? "bg-primary/20 border border-primary"
                      : "hover:bg-base-300"
                  }`}
                >
                  <div className="relative">
                    <img
                      src={user.profilePic || "/avatar.png"}
                      alt={user.fullName}
                      className="size-10 rounded-full object-cover"
                    />
                    {selectedMembers.includes(user._id) && (
                      <div className="absolute -top-1 -right-1 bg-primary text-primary-content rounded-full p-0.5">
                        <Check className="size-3" />
                      </div>
                    )}
                  </div>
                  <span className="font-medium">{user.fullName}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        
        <div className="flex gap-3 p-4 border-t border-base-300">
          <button
            onClick={handleClose}
            className="flex-1 py-2 px-4 border border-base-300 rounded-lg hover:bg-base-300 transition-colors"
            disabled={isCreating}
          >
            Cancel
          </button>
          <button
            onClick={handleCreateGroup}
            disabled={isCreating || !groupName.trim() || selectedMembers.length === 0}
            className="flex-1 py-2 px-4 bg-primary text-primary-content rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isCreating ? (
              <>
                <div className="size-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="size-4" />
                Create Group
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateGroupModal; 