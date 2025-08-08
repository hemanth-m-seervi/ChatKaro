import { useEffect, useState } from "react";
import { useChatStore } from "../store/useChatStore";
import { useGroupStore } from "../store/useGroupStore";
import { useAuthStore } from "../store/useAuthStore";
import SidebarSkeleton from "./skeletons/SidebarSkeleton";
import { Users, Search, MessageCircle, Plus } from "lucide-react";
import CreateGroupModal from "./CreateGroupModal";

const Sidebar = () => {
  const {
    getUsers,
    users,
    selectedUser,
    setSelectedUser,
    isUsersLoading,
    markMessagesAsRead,
    refreshUsers,
  } = useChatStore();
  const {
    getGroups,
    groups,
    selectedGroup,
    setSelectedGroup,
    isGroupsLoading,
  } = useGroupStore();
  const { onlineUsers, socket, authUser } = useAuthStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("chats");
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);

  useEffect(() => {
    getUsers();
    getGroups();
  }, [getUsers, getGroups]);

  useEffect(() => {
    if (socket && authUser) {
      useGroupStore.getState().subscribeToGroupMessages();
      return () => {
        useGroupStore.getState().unsubscribeFromGroupMessages();
      };
    }
  }, [socket, authUser]);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshUsers();
    }, 30000);
    return () => clearInterval(interval);
  }, [refreshUsers]);

  const filteredAndSortedUsers = users
    .filter((user) =>
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (a.unseenCount > 0 && b.unseenCount === 0) return -1;
      if (a.unseenCount === 0 && b.unseenCount > 0) return 1;
      if (a.unseenCount > 0 && b.unseenCount > 0) {
        return b.unseenCount - a.unseenCount;
      }
      return a.fullName.localeCompare(b.fullName);
    });

  const filteredAndSortedGroups = groups
    .filter((group) =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (a.unseenCount > 0 && b.unseenCount === 0) return -1;
      if (a.unseenCount === 0 && b.unseenCount > 0) return 1;
      if (a.unseenCount > 0 && b.unseenCount > 0) {
        return b.unseenCount - a.unseenCount;
      }
      return a.name.localeCompare(b.name);
    });

  const handleUserSelect = async (user) => {
    setSelectedUser(user);
    setSelectedGroup(null);
    if (user.unseenCount > 0) {
      await markMessagesAsRead(user._id);
    }
  };

  const handleGroupSelect = (group) => {
    setSelectedGroup(group);
    setSelectedUser(null);
  };

  if (isUsersLoading || isGroupsLoading) return <SidebarSkeleton />;

  return (
    <>
      <aside className="h-full w-20 lg:w-72 border-r border-base-300 flex flex-col transition-all duration-200">
        {/* Top Tabs */}
        <div className="border-b border-base-300 p-2">
          <div className="flex flex-col sm:flex-row bg-base-200 rounded-lg p-1 gap-1 sm:gap-0">
            <button
              onClick={() => setActiveTab("chats")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === "chats"
                  ? "bg-primary text-primary-content shadow-sm"
                  : "text-base-content/70 hover:text-base-content"
              }`}
            >
              <MessageCircle className="size-5 sm:size-4" />
              <span className="hidden lg:block">Chats</span>
            </button>
            <button
              onClick={() => setActiveTab("groups")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                activeTab === "groups"
                  ? "bg-primary text-primary-content shadow-sm"
                  : "text-base-content/70 hover:text-base-content"
              }`}
            >
              <Users className="size-5 sm:size-4" />
              <span className="hidden lg:block">Groups</span>
            </button>
          </div>
        </div>

        
        <div className="border-b border-base-300 w-full p-3 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {activeTab === "chats" ? (
                <>
                  <MessageCircle className="size-5 sm:size-6" />
                  <span className="font-medium hidden lg:block">Contacts</span>
                </>
              ) : (
                <>
                  <Users className="size-5 sm:size-6" />
                  <span className="font-medium hidden lg:block">Groups</span>
                </>
              )}
            </div>

            {activeTab === "groups" && (
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={() => setShowCreateGroupModal(true)}
                  className="p-2 hover:bg-base-300 rounded-lg transition-colors"
                  title="Create Group"
                >
                  <Plus className="size-5" />
                </button>
                <button
                  onClick={() => getGroups()}
                  className="p-2 hover:bg-base-300 rounded-lg transition-colors"
                  title="Reload Groups"
                >
                  <img
                    src="/refresh.png"
                    alt="Reload"
                    className="w-4 h-4"
                    style={{ filter: "invert(0.6)" }}
                  />
                </button>
              </div>
            )}
          </div>

          
          <div className="mt-3 relative w-full">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-zinc-400" />
              <input
                type="text"
                placeholder={
                  activeTab === "chats"
                    ? "Search contacts..."
                    : "Search groups..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-3 py-1.5 sm:py-2 bg-base-200 border border-base-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
        </div>

        
        <div className="overflow-y-auto w-full py-3">
          {activeTab === "chats" ? (
            <>
              {filteredAndSortedUsers.map((user) => (
                <button
                  key={user._id}
                  onClick={() => handleUserSelect(user)}
                  className={`w-full p-3 flex items-center gap-3 hover:bg-base-300 transition-colors ${
                    selectedUser?._id === user._id
                      ? "bg-base-300 ring-1 ring-base-300"
                      : ""
                  } ${user.unseenCount > 0 ? "bg-base-200/50" : ""}`}
                >
                  <div className="relative mx-auto lg:mx-0">
                    <img
                      src={user.profilePic || "/avatar.png"}
                      alt={user.name}
                      className="size-10 sm:size-12 object-cover rounded-full"
                    />
                    {onlineUsers.includes(user._id) && (
                      <span className="absolute bottom-0 right-0 size-3 bg-green-500 rounded-full ring-2 ring-zinc-900" />
                    )}
                    {user.unseenCount > 0 && (
                      <span className="lg:hidden absolute -top-1 -right-1 bg-primary text-primary-content text-xs font-medium px-1.5 py-0.5 rounded-full min-w-[18px] text-center ring-2 ring-base-100">
                        {user.unseenCount > 99 ? "99+" : user.unseenCount}
                      </span>
                    )}
                  </div>
                  <div className="hidden lg:block text-left min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-medium truncate">
                        {user.fullName}
                      </div>
                      {user.unseenCount > 0 && (
                        <span className="bg-primary text-primary-content text-xs font-medium px-2 py-1 rounded-full min-w-[20px] text-center">
                          {user.unseenCount > 99 ? "99+" : user.unseenCount}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-zinc-400">
                      {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                    </div>
                  </div>
                </button>
              ))}

              {filteredAndSortedUsers.length === 0 && (
                <div className="text-center text-zinc-500 py-4">
                  {searchQuery ? "No contacts found" : "No contacts"}
                </div>
              )}
            </>
          ) : (
            <>
              {filteredAndSortedGroups.map((group) => (
                <button
                  key={group._id}
                  onClick={() => handleGroupSelect(group)}
                  className={`w-full p-3 flex items-center gap-3 hover:bg-base-300 transition-colors ${
                    selectedGroup?._id === group._id
                      ? "bg-base-300 ring-1 ring-base-300"
                      : ""
                  } ${group.unseenCount > 0 ? "bg-base-200/50" : ""}`}
                >
                  <div className="relative mx-auto lg:mx-0">
                    <img
                      src={group.avatar || "/avatar.png"}
                      alt={group.name}
                      className="size-10 sm:size-12 object-cover rounded-full"
                    />
                    {group.unseenCount > 0 && (
                      <span className="lg:hidden absolute -top-1 -right-1 bg-primary text-primary-content text-xs font-medium px-1.5 py-0.5 rounded-full min-w-[18px] text-center ring-2 ring-base-100">
                        {group.unseenCount > 99 ? "99+" : group.unseenCount}
                      </span>
                    )}
                  </div>
                  <div className="hidden lg:block text-left min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-medium truncate">{group.name}</div>
                      {group.unseenCount > 0 && (
                        <span className="bg-primary text-primary-content text-xs font-medium px-2 py-1 rounded-full min-w-[20px] text-center">
                          {group.unseenCount > 99 ? "99+" : group.unseenCount}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-zinc-400">
                      {group.members.length} members
                    </div>
                  </div>
                </button>
              ))}

              {filteredAndSortedGroups.length === 0 && (
                <div className="text-center text-zinc-500 py-4">
                  {searchQuery ? "No groups found" : "No groups"}
                </div>
              )}
            </>
          )}
        </div>
      </aside>

     
      <CreateGroupModal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
      />
    </>
  );
};

export default Sidebar;
