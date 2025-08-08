import { useRef, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { Image, Send, X } from "lucide-react";
import toast from "react-hot-toast";

const MessageInput = () => {
  const [text, setText] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const { sendMessage } = useChatStore();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imagePreview) return;

    try {
      await sendMessage({
        text: text.trim(),
        image: imagePreview,
      });

      // Clear form
      setText("");
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      toast.error("Failed to send message. Please try again.");
      console.error("Error sending message:", error);
    }
  };

  return (
    <div className="p-3 border-t border-base-300">
      {imagePreview && (
        <div className="relative mb-2 w-fit max-w-xs">
          <img
            src={imagePreview}
            alt="Preview"
            className="h-24 rounded-md object-contain border"
          />
          <button
            onClick={removeImage}
            className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      <form
        onSubmit={handleSendMessage}
        className="flex items-center gap-2"
      >
        <input
          type="text"
          className="flex-1 px-3 py-2 text-sm bg-base-200 border border-base-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleImageChange}
        />

        <button
          type="button"
          className="p-2 hover:bg-base-300 rounded-md transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Image className="size-4" />
        </button>

        <button
          type="submit"
          disabled={!text.trim() && !imagePreview}
          className="p-2 bg-primary text-primary-content rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="size-4" />
        </button>
      </form>
    </div>
  );
};

export default MessageInput;
