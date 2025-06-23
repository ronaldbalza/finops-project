import { useState, useEffect } from 'react';
import ChatWidget from './ChatWidget';
import { MessageCircle, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function ChatLauncher() {
  const [open, setOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const { auth, authFetch } = useAuth();
  const tenantId = auth?.type === 'tenant-user' ? auth.tenantId : null;
  const myId = auth?.id;

  // 🔔 Unread indicator polling - temporarily disabled as conversations are now per-recipient
  useEffect(() => {
    // TODO: Implement proper unread polling for individual conversations
    // For now, we disable this to prevent API errors since we changed to per-recipient conversations
    setHasUnread(false);
  }, [tenantId, myId, authFetch]);

  const handleOpen = () => {
    setOpen(true);
    setHasUnread(false); // mark as read when opened
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <>
      {/* Chat Launcher Button */}
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-full p-4 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 group"
        aria-label="Open chat"
      >
        <MessageCircle className="w-6 h-6 group-hover:rotate-12 transition-transform duration-200" />
        {hasUnread && (
          <span className="absolute -top-1 -right-1 block h-4 w-4 rounded-full bg-red-500 ring-2 ring-white animate-pulse">
            <span className="sr-only">New messages</span>
          </span>
        )}
      </button>

      {/* Chat Window */}
      {open && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-25 z-40 md:hidden"
            onClick={handleClose}
          />
          
          {/* Chat Container */}
          <div className="fixed bottom-6 right-6 z-50 w-[380px] h-[600px] max-w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] bg-white shadow-2xl rounded-2xl overflow-hidden border border-gray-200 animate-in slide-in-from-bottom-2 md:animate-in md:slide-in-from-right-2">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Team Chat</h3>
                  <p className="text-xs text-blue-100">Connect with your team</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                aria-label="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Chat Content */}
            <div className="h-[calc(100%-80px)]">
              <ChatWidget />
            </div>
          </div>
        </>
      )}
    </>
  );
}
