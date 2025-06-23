import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import dayjs from 'dayjs';
import { API_BASE_URL } from '../utils/api';

// Remove Socket.IO initialization
const BACKEND_URL = API_BASE_URL;
const POLLING_INTERVAL = 3000; // Poll every 3 seconds

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
  pending?: boolean;
  readBy?: string[]; // Array of user IDs who have read this message
  reactions?: Reaction[]; // Array of reactions to this message
}

interface Reaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  user: {
    id: string;
    email: string;
  };
}

interface User {
  id: string;
  email: string;
}

export default function ChatWidget() {
  const { auth, authFetch } = useAuth();
  const id = auth?.id;
  const tenantId = auth?.type === 'tenant-user' ? (auth as any).tenantId : null;

  const [users, setUsers] = useState<User[]>([]);
  const [recipientId, setRecipientId] = useState(localStorage.getItem('lastRecipient') || '');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(() => new Set([...Array<string>()]));
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [lastMessageTimestamp, setLastMessageTimestamp] = useState<string | null>(null);

  const pollingIntervalRef = useRef<number>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const anchorMessageRef = useRef<HTMLDivElement>(null);
  const isLoadingRef = useRef(false);
  const typingTimeoutRef = useRef<number | null>(null);

  const conversationId = id && recipientId && id !== recipientId ? [id, recipientId].sort().join('_') : '';
  
  // Debug conversation setup
  useEffect(() => {
    console.log(`🔧 ConversationId effect triggered. ID: ${id}, RecipientId: ${recipientId}, ConversationId: ${conversationId}`);
    
    if (conversationId) {
      console.log(`💬 Conversation: ${auth?.email} ↔ ${getEmail(recipientId)} (ID: ${conversationId})`);
      
      // Debug localStorage contents
      const existingMessages = localStorage.getItem(`messages_${conversationId}`);
      console.log(`🔍 Existing messages in localStorage for ${conversationId}:`, existingMessages ? JSON.parse(existingMessages).length : 0);
      
      // Debug all conversation keys in localStorage
      const allKeys = Object.keys(localStorage).filter(key => key.startsWith('messages_'));
      console.log(`🗂️ All message keys in localStorage:`, allKeys);
    }
  }, [conversationId, id, recipientId, auth?.email, users]);

  // Updated getEmail function
  const getEmail = (uid: string) => {
    if (uid === id && auth?.email) return auth.email;
    return users.find((u) => u.id === uid)?.email || 'Unknown user';
  };

  // Get user initials for avatar
  const getUserInitials = (uid: string) => {
    const email = getEmail(uid);
    return email.split('@')[0].slice(0, 2).toUpperCase();
  };

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      return permission;
    }
    return 'denied';
  };

  // Show notification for new message
  const showNotification = (message: Message) => {
    if (notificationPermission === 'granted' && 'Notification' in window) {
      const senderEmail = getEmail(message.senderId);
      const senderName = senderEmail.split('@')[0];
      
      const notification = new Notification(`New message from ${senderName}`, {
        body: message.content,
        icon: '/favicon.ico', // You can customize this
        badge: '/favicon.ico',
        tag: `chat-${message.conversationId}` // Prevent duplicate notifications
      });

      // Auto-close notification after 5 seconds
      setTimeout(() => notification.close(), 5000);

      // Focus window when notification is clicked
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  };

  // Initialize notifications permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
      // Auto-request permission if not determined
      if (Notification.permission === 'default') {
        requestNotificationPermission();
      }
    }
  }, []);

  // Fetch users for the tenant with proper error handling
  useEffect(() => {
    if (!tenantId) return;
    
    const fetchUsers = async () => {
      try {
        setError(null);
        // Use the chat-specific API endpoint that allows regular users to fetch tenant users
        const res = await authFetch(`${BACKEND_URL}/api/users/chat/${tenantId}`);
        const data = await res.json();
        
        let merged = Array.isArray(data) ? data : [];
        
        // Always include the current user in the list
        if (id && auth?.email && !merged.some((u: User) => u.id === id)) {
          merged = [...merged, { id, email: auth.email }];
        }
        
        setUsers(merged);
      } catch (error) {
        console.error('Failed to fetch users:', error);
        setError('Failed to load team members');
        
        // Fallback: at least include the current user
        if (id && auth?.email) {
          setUsers([{ id, email: auth.email }]);
        } else {
          setUsers([]);
        }
      }
    };

    fetchUsers();
  }, [tenantId, id, auth?.email, authFetch]);

  // Poll for new messages
  useEffect(() => {
    if (!conversationId) return;

    const pollMessages = async () => {
      try {
        const query = lastMessageTimestamp 
          ? `?since=${encodeURIComponent(lastMessageTimestamp)}`
          : '';
          
        const response = await authFetch(`${BACKEND_URL}/api/messages/${conversationId}${query}`);
        const newMessages = await response.json();
        
        if (newMessages.length > 0) {
          setMessages(prev => {
            // Remove any pending messages that have been confirmed
            const withoutConfirmed = prev.filter(m => 
              !m.pending || !newMessages.some((nm: Message) => 
                nm.content === m.content && nm.senderId === m.senderId
              )
            );
            
            // Add new messages
            const merged = [...withoutConfirmed, ...newMessages];
            
            // Sort by createdAt
            return merged.sort((a, b) => 
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
          });
          
          // Update last message timestamp
          const latestMessage = newMessages[newMessages.length - 1];
          setLastMessageTimestamp(latestMessage.createdAt);
          
          // Show notification if message is from other user
          if (latestMessage.senderId !== id) {
            showNotification(latestMessage);
          }
        }
      } catch (error) {
        console.error('Error polling messages:', error);
      }
    };

    // Start polling
    pollingIntervalRef.current = window.setInterval(pollMessages, POLLING_INTERVAL);

    // Initial poll
    pollMessages();

    // Cleanup
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [conversationId, lastMessageTimestamp, authFetch, id]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    if (!conversationId || isLoadingRef.current) return;

    isLoadingRef.current = true;
    setLoadingMessages(true);
    setError(null);
    
    try {
      console.log(`🔍 Loading messages for conversation ${conversationId} from API`);
      
      // Load messages from the API
      const res = await authFetch(`${API_BASE_URL}/api/conversations/key/${conversationId}`);
      
      if (res.ok) {
        const conversation = await res.json();
        const apiMessages = conversation.messages || [];
        
        console.log(`📚 Loaded ${apiMessages.length} messages from API:`, apiMessages.map((m: any) => `${m.senderId}: ${m.content}`));
        
        // Transform API messages to match our Message interface
        const transformedMessages: Message[] = apiMessages.map((msg: any) => ({
          id: msg.id,
          conversationId: conversationId,
          senderId: msg.senderId,
          content: msg.content,
          imageUrl: msg.imageUrl,
          createdAt: msg.createdAt,
          pending: false,
          readBy: msg.readBy ? msg.readBy.map((user: any) => user.id) : [],
          reactions: msg.reactions || []
        }));
        
        setMessages(transformedMessages);
        
        // Cache in localStorage as backup
        localStorage.setItem(`messages_${conversationId}`, JSON.stringify(transformedMessages));
        
        // Mark unread messages as read
        const unreadMessages = transformedMessages.filter(msg => 
          msg.senderId !== id && (!msg.readBy || !msg.readBy.includes(id!))
        );
        
        if (unreadMessages.length > 0) {
          try {
            await authFetch(`${API_BASE_URL}/api/conversations/key/${conversationId}/read`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ messageIds: unreadMessages.map(m => m.id) })
            });
            console.log(`📖 Marked ${unreadMessages.length} messages as read`);
          } catch (readError) {
            console.error('Failed to mark messages as read:', readError);
          }
        }
        
      } else if (res.status === 404) {
        console.log(`📝 No conversation found for ${conversationId}, starting fresh`);
        setMessages([]);
      } else {
        throw new Error(`API returned ${res.status}`);
      }
      
      setHasMore(false);
      
    } catch (error) {
      console.error('Load messages API error:', error);
      
      // Fallback to localStorage if API fails
      console.log('🔄 Falling back to localStorage');
      const localMessages = localStorage.getItem(`messages_${conversationId}`);
      if (localMessages) {
        try {
          const parsedMessages = JSON.parse(localMessages);
          console.log(`📚 Loaded ${parsedMessages.length} messages from localStorage fallback`);
          setMessages(parsedMessages);
        } catch (parseError) {
          console.error('Failed to parse local messages:', parseError);
          setMessages([]);
        }
      } else {
        setMessages([]);
      }
      
      setError('Using offline mode - some messages may be missing');
    } finally {
      setLoadingMessages(false);
      isLoadingRef.current = false;
    }
  };

  const sendMessage = async () => {
    if (!input.trim() && !imageFile) return;
    
    const tempId = `temp-${Date.now()}`;
    const tempMessage: Message = {
      id: tempId,
      conversationId,
      senderId: id!,
      content: input,
      createdAt: new Date().toISOString(),
      pending: true
    };

    // Optimistically add message
    setMessages(prev => [...prev, tempMessage]);
    setInput('');
    setImageFile(null);
    
    try {
      const formData = new FormData();
      formData.append('content', input);
      if (imageFile) {
        formData.append('image', imageFile);
      }
      
      const response = await authFetch(`${BACKEND_URL}/api/messages/${conversationId}`, {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to send message');
      }
      
      const confirmedMessage = await response.json();
      
      // Replace temp message with confirmed message
      setMessages(prev => 
        prev.map(m => m.id === tempId ? confirmedMessage : m)
      );
      
      // Update last message timestamp
      setLastMessageTimestamp(confirmedMessage.createdAt);
      
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove temp message on error
      setMessages(prev => prev.filter(m => m.id !== tempId));
      setError('Failed to send message');
    }
  };

  const handleScroll = async () => {
    const el = scrollContainerRef.current;
    if (!el || el.scrollTop > 50 || !hasMore || isLoadingRef.current) return;

    const first = messages[0];
    if (!first) return;

    anchorMessageRef.current?.scrollIntoView();
    isLoadingRef.current = true;

    try {
      setError(null);
      
      // Backend doesn't have separate pagination endpoint for messages
      // Messages are included in the conversation response, so disable pagination for now
      setHasMore(false);
      
    } catch (error) {
      console.error('Load older messages error:', error);
      setHasMore(false);
    } finally {
      isLoadingRef.current = false;
    }
  };

  const handleRecipientChange = (id: string) => {
    console.log(`🔄 Switching from ${recipientId} to ${id}`);
    
    // Prevent self-conversation
    if (id === auth?.id) {
      console.log(`❌ Cannot chat with yourself`);
      setError('Cannot chat with yourself');
      return;
    }
    
    // Log what's currently in messages before clearing
    console.log(`📦 Current messages before switch:`, messages.length, messages.map((m: Message) => `${m.senderId}: ${m.content}`));
    console.log(`👥 Available users:`, users.map(u => `${u.id}: ${u.email}`));
    console.log(`👤 Current user ID: ${auth?.id}, email: ${auth?.email}`);
    
    setRecipientId(id);
    localStorage.setItem('lastRecipient', id);
    
    // Clear current state immediately
    setMessages([]);
    setHasMore(true);
    setError(null);
    setInput('');
    setImageFile(null);
    setTypingUsers(new Set()); // Clear typing indicators
    
    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    
    const newConversationId = auth?.id && id ? [auth.id, id].sort().join('_') : 'none';
    console.log(`🆔 New conversation ID will be: ${newConversationId}`);
    
    // Check what's in localStorage for the new conversation
    if (newConversationId !== 'none') {
      const existingMessages = localStorage.getItem(`messages_${newConversationId}`);
      console.log(`🔍 Existing messages for new conversation:`, existingMessages ? JSON.parse(existingMessages).length : 0);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Handle typing indicators
  const handleTypingStatus = (isTyping: boolean) => {
    if (!conversationId || !id) return;

    try {
      authFetch(`${BACKEND_URL}/api/conversations/${conversationId}/typing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: id,
          isTyping
        })
      });
    } catch (error) {
      console.error('Error updating typing status:', error);
    }
  };

  // Handle input change with typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Send typing indicator
    handleTypingStatus(true);
    
    // Set timeout to clear typing indicator
    typingTimeoutRef.current = window.setTimeout(() => {
      handleTypingStatus(false);
    }, 2000) as unknown as number;
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      console.log(`Adding reaction ${emoji} to message ${messageId}`);
      
      const res = await authFetch(`${API_BASE_URL}/api/conversations/messages/${messageId}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emoji })
      });

      if (res.ok) {
        const result = await res.json();
        console.log(`Reaction ${result.action}: ${emoji} on message ${messageId}`);
        
        // Refresh messages to get updated reactions
        loadMessages();
      } else {
        console.error('Failed to add reaction:', res.status);
      }
    } catch (error) {
      console.error('Error adding reaction:', error);
    }
  };

  const getReactionSummary = (reactions: Reaction[]) => {
    const summary: { [emoji: string]: { count: number; users: string[] } } = {};
    
    reactions.forEach(reaction => {
      if (!summary[reaction.emoji]) {
        summary[reaction.emoji] = { count: 0, users: [] };
      }
      summary[reaction.emoji].count++;
      summary[reaction.emoji].users.push(reaction.user.email.split('@')[0]);
    });
    
    return summary;
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Error Banner */}
      {error && (
        <div className="p-3 bg-red-50 border-b border-red-200 text-red-700 text-sm flex items-center justify-between">
          <span>⚠️ {error}</span>
          <button 
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 font-bold text-lg leading-none"
          >
            ×
          </button>
        </div>
      )}

      {/* User Selection */}
      <div className="p-4 border-b border-gray-200">
        <label htmlFor="recipient" className="block text-xs font-medium text-gray-700 mb-2">
          Chat with
        </label>
        <select
          id="recipient"
          value={recipientId}
          onChange={(e) => handleRecipientChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
        >
          <option value="">Select a user...</option>
          {users.filter(u => u.id !== id).map((u) => (
            <option key={u.id} value={u.id}>
              {u.email}
            </option>
          ))}
        </select>
      </div>

      {/* Messages Area */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
      >
        {(() => {
          console.log(`🎨 Rendering messages area. Recipient: ${recipientId}, Messages: ${messages.length}, Array.isArray: ${Array.isArray(messages)}`);
          console.log(`🎨 Messages to render:`, messages.map((m: Message) => `${m.senderId}: ${m.content}`));
          return null;
        })()}
        
        {!recipientId ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">💬</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Team Member</h3>
            <p className="text-gray-500 text-sm">Choose someone from the dropdown above to start chatting</p>
          </div>
        ) : !conversationId ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">⚠️</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Invalid Selection</h3>
            <p className="text-gray-500 text-sm">Please select a different team member to chat with</p>
          </div>
        ) : loadingMessages ? (
          <div className="flex flex-col items-center justify-center h-full py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-500 text-sm">Loading messages...</p>
          </div>
        ) : Array.isArray(messages) && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <span className="text-2xl">🚀</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Start the conversation</h3>
            <p className="text-gray-500 text-sm">Send your first message to {getEmail(recipientId)}</p>
          </div>
        ) : (
          Array.isArray(messages) &&
          messages.map((msg, i) => {
            const isMyMessage = msg.senderId === id;
            return (
              <div
                key={msg.id}
                ref={i === 0 ? anchorMessageRef : null}
                className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'} ${msg.pending ? "opacity-60" : ""} group`}
              >
                <div className={`flex max-w-xs lg:max-w-md ${isMyMessage ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2`}>
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white ${
                    isMyMessage ? 'bg-blue-600 ml-2' : 'bg-gray-600 mr-2'
                  }`}>
                    {getUserInitials(msg.senderId)}
                  </div>
                  
                  {/* Message Bubble */}
                  <div className={`rounded-2xl px-4 py-2 ${
                    isMyMessage 
                      ? 'bg-blue-600 text-white rounded-br-sm' 
                      : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'
                  }`}>
                    {/* Message Header */}
                    <div className={`text-xs ${isMyMessage ? 'text-blue-100' : 'text-gray-500'} mb-1`}>
                      {isMyMessage ? 'You' : getEmail(msg.senderId).split('@')[0]}
                      <span className="ml-2">{dayjs(msg.createdAt).format('HH:mm')}</span>
                      {msg.pending && <span className="ml-2 animate-pulse">Sending...</span>}
                      {/* Read Receipt Indicator */}
                      {isMyMessage && !msg.pending && (
                        <span className="ml-2">
                          {msg.readBy && msg.readBy.length > 1 ? (
                            <span className="text-green-400">✓✓</span> // Double check for read
                          ) : (
                            <span className="text-gray-400">✓</span> // Single check for delivered
                          )}
                        </span>
                      )}
                    </div>
                    
                    {/* Message Content */}
                    {msg.content && (
                      <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                    )}
                    
                    {/* Image Attachment */}
                    {msg.imageUrl && (
                      <div className="mt-2">
                        <img
                          src={msg.imageUrl}
                          alt="attachment"
                          className="max-w-full h-auto rounded-lg border border-gray-200"
                          style={{ maxHeight: '200px' }}
                        />
                      </div>
                    )}
                    
                    {/* Reactions */}
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {Object.entries(getReactionSummary(msg.reactions)).map(([emoji, data]) => (
                          <button
                            key={emoji}
                            onClick={() => handleReaction(msg.id, emoji)}
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs border transition-colors ${
                              data.users.includes(auth?.email?.split('@')[0] || '') 
                                ? 'bg-blue-100 border-blue-300 text-blue-700' 
                                : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                            }`}
                            title={`${data.users.join(', ')} reacted with ${emoji}`}
                          >
                            <span className="mr-1">{emoji}</span>
                            <span>{data.count}</span>
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {/* Quick Reaction Buttons */}
                    {!msg.pending && (
                      <div className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex gap-1">
                          {['👍', '❤️', '😂', '😮', '😢', '😡'].map(emoji => (
                            <button
                              key={emoji}
                              onClick={() => handleReaction(msg.id, emoji)}
                              className="w-6 h-6 text-sm hover:bg-gray-200 rounded transition-colors"
                              title={`React with ${emoji}`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        

        
        <div ref={scrollRef} />
      </div>

      {/* Input Area */}
      {recipientId && (
        <div className="p-4 bg-white border-t border-gray-200">
          {/* Typing Indicators */}
          {typingUsers.size > 0 && (
            <div className="mb-3 px-1">
              <div className="text-xs text-gray-500 italic">
                {Array.from(typingUsers).map(userId => getEmail(userId).split('@')[0]).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
              </div>
            </div>
          )}
          {/* File Attachment Preview */}
          {imageFile && (
            <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">📎 {imageFile.name}</span>
                  <span className="text-xs text-gray-400">({(imageFile.size / 1024 / 1024).toFixed(1)}MB)</span>
                </div>
                <button
                  onClick={() => setImageFile(null)}
                  className="text-gray-400 hover:text-gray-600 text-lg leading-none"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          <div className="flex items-end space-x-2">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
              title="Attach image"
            >
              📎
            </button>

            <div className="flex-1">
              <textarea
                value={input}
                onChange={handleInputChange}
                onKeyPress={handleKeyPress}
                placeholder={`Message ${getEmail(recipientId).split('@')[0]}...`}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-sm"
                rows={1}
                style={{ minHeight: '40px', maxHeight: '120px' }}
              />
            </div>

            <button
              onClick={sendMessage}
              disabled={!input.trim() && !imageFile}
              className="flex-shrink-0 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-2 rounded-lg transition-colors flex items-center justify-center min-w-[40px]"
            >
              <span className="text-lg">🚀</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
