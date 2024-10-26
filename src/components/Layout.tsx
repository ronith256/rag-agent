// src/components/Layout.tsx
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Grid, PenSquare, BarChart3, Menu, FileCheck, User, Users } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  isExpanded: boolean;
  isActive: boolean;
}

const SidebarItem = ({ icon, label, href, isExpanded, isActive }: SidebarItemProps) => {
  return (
    <Link 
      to={href}
      className={`flex items-center gap-4 p-4 hover:bg-gray-800 transition-colors ${
        isActive ? 'bg-gray-800' : ''
      }`}
    >
      {icon}
      {isExpanded && (
        <span className="text-sm font-medium text-gray-200">{label}</span>
      )}
    </Link>
  );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  
  const navigate = useNavigate();

  const baseItems = [
    { icon: <Grid className="w-5 h-5 text-gray-400" />, label: 'Agents', href: '/agents' },
    { icon: <PenSquare className="w-5 h-5 text-gray-400" />, label: 'Create Agent', href: '/create' },
    { icon: <BarChart3 className="w-5 h-5 text-gray-400" />, label: 'Analytics', href: '/analytics' },
    { icon: <FileCheck className="w-5 h-5 text-gray-400" />, label: 'Evaluations', href: '/evaluations' },
  ];

  const adminItems = [
    { icon: <Users className="w-5 h-5 text-gray-400" />, label: 'Users', href: '/users' },
  ];

  const sidebarItems = user?.email === import.meta.env.VITE_ADMIN_EMAIL 
    ? [...baseItems, ...adminItems]
    : baseItems;

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleProfileClick = () => {
    if (!isExpanded) {
      setIsExpanded(true);
    }
    setShowProfileMenu(!showProfileMenu);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div 
        className={`bg-gray-900 text-white transition-all duration-300 flex flex-col ${
          isExpanded ? 'w-64' : 'w-16'
        }`}
      >
        <button
          onClick={() => {
            setIsExpanded(!isExpanded);
            setShowProfileMenu(false);
          }}
          className="w-full p-4 flex justify-center hover:bg-gray-800 transition-colors"
        >
          <Menu className="w-5 h-5 text-gray-400" />
        </button>

        <div className="mt-4 flex-1">
          {sidebarItems.map((item) => (
            <SidebarItem
              key={item.href}
              {...item}
              isExpanded={isExpanded}
              isActive={location.pathname === item.href}
            />
          ))}
        </div>

        {/* Profile Section */}
        <div className="relative border-t border-gray-800">
          <button
            onClick={handleProfileClick}
            className={`w-full p-4 flex items-center gap-4 hover:bg-gray-800 transition-colors ${
              showProfileMenu ? 'bg-gray-800' : ''
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
              <User className="w-5 h-5 text-gray-400" />
            </div>
            {isExpanded && (
              <span className="text-sm font-medium text-gray-200 truncate">
                {user?.email || 'User'}
              </span>
            )}
          </button>

          {/* Profile Menu Dropdown */}
          {showProfileMenu && (
            <div className="absolute bottom-full left-0 w-full bg-gray-800 rounded-t-lg overflow-hidden shadow-lg">
              <div className="p-4 border-b border-gray-700">
                <p className="text-sm text-gray-400">Signed in as</p>
                <p className="text-sm font-medium text-gray-200 truncate">
                  {user?.email}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full p-4 text-left text-sm text-gray-200 hover:bg-gray-700 transition-colors"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
};

export default Layout;