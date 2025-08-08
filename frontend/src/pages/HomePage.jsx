import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";
import { useEffect } from "react";

import Sidebar from "../components/Sidebar";
import NoChatSelected from "../components/NoChatSelected";
import ChatContainer from "../components/ChatContainer";
import GroupChatContainer from "../components/GroupChatContainer";

const HomePage = () => {
  const { selectedUser, subscribeToMessages, unsubscribeFromMessages } =
    useChatStore();
  const {
    selectedGroup,
    subscribeToGroupMessages,
    unsubscribeFromGroupMessages,
  } = useGroupStore();

  useEffect(() => {
    subscribeToMessages();
    subscribeToGroupMessages();
    return () => {
      unsubscribeFromMessages();
      unsubscribeFromGroupMessages();
    };
  }, [
    subscribeToMessages,
    subscribeToGroupMessages,
    unsubscribeFromMessages,
    unsubscribeFromGroupMessages,
  ]);

  const showIndividualChat = selectedUser && !selectedGroup;
  const showGroupChat = selectedGroup && !selectedUser;

  return (
    <div className="h-screen bg-base-200">
      <div className="flex items-center justify-center pt-20 px-4">
        <div className="bg-base-100 rounded-lg shadow-cl w-full max-w-6xl h-[calc(100vh-8rem)]">
          <div className="flex h-full rounded-lg overflow-hidden">
            <Sidebar />

            {!selectedUser && !selectedGroup ? (
              <NoChatSelected />
            ) : showIndividualChat ? (
              <ChatContainer />
            ) : showGroupChat ? (
              <GroupChatContainer />
            ) : (
              <NoChatSelected />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default HomePage;
