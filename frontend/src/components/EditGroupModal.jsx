import { useState, useEffect } from "react";
import {
  X,
  Trash2,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { useGroupStore } from "../store/useGroupStore";
import toast from "react-hot-toast";

const EditGroupModal = ({ group, isOpen, onClose }) => {
  const { updateGroup, deleteGroup } = useGroupStore();

  const [name, setName] = useState(group?.name || "");
  const [description, setDescription] = useState(group?.description || "");
  const [avatar, setAvatar] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setName(group?.name || "");
    setDescription(group?.description || "");
    setAvatar("");
  }, [group, isOpen]);

  const handleAvatarUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setAvatar(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      await updateGroup(group._id, {
        name: name.trim(),
        description: description.trim(),
        avatar,
      });
      onClose();
    } catch (error) {
      toast.error("Failed to update group. Please try again.");
      console.error("Error updating group:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteGroup(group._id);
      onClose();
    } catch (error) {
      toast.error("Failed to delete group. Please try again.");
      console.error("Error deleting group:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{background: "rgba(255,255,255,0.6)", backdropFilter: "blur(8px)"}}>
      <div className="bg-base-100 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden">
        
        <div className="flex items-center justify-between p-4 border-b border-base-300">
          <h2 className="text-lg font-semibold">Edit Group</h2>
          <button
            onClick={onClose}
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
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              placeholder="Enter group description"
              className="w-full p-3 border border-base-300 rounded-lg bg-base-200 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              rows={3}
              maxLength={200}
            />
          </div>

          
          <div>
            <label className="block text-sm font-medium mb-2">Group Avatar</label>
            <div className="flex items-center gap-3">
              <img
                src={avatar || group?.avatar || "/avatar.png"}
                alt="Group Avatar"
                className="w-16 h-16 rounded-full object-cover border border-zinc-300"
              />
              <label className="cursor-pointer btn btn-sm btn-outline flex items-center gap-2">
                <ImageIcon className="size-4" />
                Upload
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        
        <div className="flex gap-3 p-4 border-t border-base-300">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex-1 py-2 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="size-4" />
                Delete Group
              </>
            )}
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
            className="flex-1 py-2 px-4 bg-primary text-primary-content rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>Save Changes</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditGroupModal;
