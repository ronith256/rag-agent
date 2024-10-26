// src/pages/UsersPage.tsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Mail, Share2, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { Agent } from '@/types/types';

interface UserData {
  uid: string;
  email: string;
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  agent: Agent;
  allUsers: UserData[];
  currentUserEmail: string;
  onShare: (selectedEmails: string[]) => Promise<void>;
}

const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  agent,
  allUsers,
  currentUserEmail,
  onShare
}) => {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isSharing, setIsSharing] = useState(false);

  if (!isOpen) return null;

  const handleShare = async () => {
    setIsSharing(true);
    try {
      await onShare(selectedUsers);
      onClose();
    } catch (error) {
      console.error('Error sharing agent:', error);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Share Agent</h3>
          <button onClick={onClose}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-2">
            Share "{agent.config.collection}" with other users
          </p>
        </div>

        <div className="max-h-60 overflow-y-auto mb-4">
          {allUsers
            .filter(user => user.email !== currentUserEmail)
            .map(user => (
              <div
                key={user.uid}
                className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-md"
              >
                <input
                  type="checkbox"
                  checked={selectedUsers.includes(user.email)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedUsers([...selectedUsers, user.email]);
                    } else {
                      setSelectedUsers(selectedUsers.filter(email => email !== user.email));
                    }
                  }}
                  className="rounded border-gray-300"
                />
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-sm">{user.email}</span>
              </div>
            ))}
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={handleShare}
            disabled={selectedUsers.length === 0 || isSharing}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSharing ? (
              <>
                <span className="animate-spin">⌛</span>
                Sharing...
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                Share
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const UsersPage = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [userAgents, setUserAgents] = useState<Agent[]>([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user?.email === import.meta.env.VITE_ADMIN_EMAIL) {
      fetchUsers();
    }
  }, [user]);

  useEffect(() => {
    if (selectedUser) {
      fetchUserAgents(selectedUser.uid);
    }
  }, [selectedUser]);

  const baseURL = import.meta.env.VITE_BACKEND_BASE_URL || '';

  const fetchUsers = async () => {
    try {
      // This would need to be implemented in your Firebase backend
      const response = await axios.get(`${baseURL}/api/users`);
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchUserAgents = async (userId: string) => {
    try {
      const response = await axios.get(`${baseURL}/api/agents/user/${userId}`);
      setUserAgents(response.data);
    } catch (error) {
      console.error('Error fetching user agents:', error);
    }
  };

  const handleShareAgent = async (selectedEmails: string[]) => {
    if (!selectedAgent) return;

    try {
      // Create the same agent for each selected user
      await Promise.all(
        selectedEmails.map(async (email) => {
          const response = await axios.post(`${baseURL}/api/agents`, {
            user_id: email,
            config: selectedAgent.config
          });
          return response.data;
        })
      );
    } catch (error) {
      console.error('Error sharing agent:', error);
      throw error;
    }
  };

  if (user?.email !== import.meta.env.VITE_ADMIN_EMAIL) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        <p className="mt-2">You don't have permission to access this page.</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>

      <div className="flex gap-6">
        {/* Users List */}
        <div className="w-64">
          <h2 className="text-lg font-semibold mb-4">Users</h2>
          <div className="space-y-3">
            {users.map((userData) => (
              <Card
                key={userData.uid}
                className={`cursor-pointer transition-all ${
                  selectedUser?.uid === userData.uid
                    ? 'border-blue-500 bg-blue-50'
                    : 'hover:border-gray-300'
                }`}
                onClick={() => setSelectedUser(userData)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {userData.email}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* User Agents */}
        {selectedUser && (
          <div className="flex-1">
            <h2 className="text-lg font-semibold mb-4">
              Agents for {selectedUser.email}
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {userAgents.map((agent) => (
                <Card key={agent.id}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">
                      {agent.config.collection}
                    </CardTitle>
                    <button
                      onClick={() => {
                        setSelectedAgent(agent);
                        setShowShareModal(true);
                      }}
                      className="p-1 hover:bg-gray-100 rounded-full"
                    >
                      <Share2 className="w-4 h-4 text-gray-500" />
                    </button>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500">
                      Model: {agent.config.llm}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {showShareModal && selectedAgent && (
        <ShareModal
          isOpen={showShareModal}
          onClose={() => {
            setShowShareModal(false);
            setSelectedAgent(null);
          }}
          agent={selectedAgent}
          allUsers={users}
          currentUserEmail={selectedUser?.email || ''}
          onShare={handleShareAgent}
        />
      )}
    </div>
  );
};

export default UsersPage;