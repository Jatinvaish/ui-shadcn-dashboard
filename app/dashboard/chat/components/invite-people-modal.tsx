// ============================================
// components/InvitePeopleModal.tsx
// ============================================

"use client";

import React, { useState } from "react";
import { X, Search } from "lucide-react";
import { User } from "@/types/chat";

// ==================== TYPES ====================
interface InvitePeopleModalProps {
  onClose: () => void;
  users: User[]; // You can pass MOCK_USERS from parent
  onInvite?: (userIds: string[]) => void; // optional callback
}

// ==================== INVITE PEOPLE MODAL ====================
const InvitePeopleModal: React.FC<InvitePeopleModalProps> = ({
  onClose,
  users,
  onInvite,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const filteredUsers = users.filter(
    (user) =>
      !selectedUsers.includes(user.id) &&
      (user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleInvite = () => {
    if (onInvite) onInvite(selectedUsers);
    setSelectedUsers([]);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-bold">Invite people</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-700 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* User List */}
        <div className="flex-1 overflow-y-auto px-4">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              onClick={() => setSelectedUsers([...selectedUsers, user.id])}
              className="flex items-center gap-3 p-3 rounded hover:bg-gray-700 cursor-pointer"
            >
              <div className="w-10 h-10 rounded bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-sm font-semibold">
                {user.firstName[0]}
                {user.lastName[0]}
              </div>
              <div className="flex-1">
                <div className="font-medium">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-sm text-gray-400">{user.email}</div>
              </div>
            </div>
          ))}
          {filteredUsers.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">
              No users found.
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-gray-700">
          <div className="text-sm text-gray-400">
            {selectedUsers.length} selected
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium hover:text-white"
            >
              Cancel
            </button>
            <button
              disabled={selectedUsers.length === 0}
              onClick={handleInvite}
              className="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded"
            >
              Invite ({selectedUsers.length})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvitePeopleModal;
