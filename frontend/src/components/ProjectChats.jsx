import { useState, useEffect, useRef } from 'react';
import { Send, Paperclip, Smile, Wifi, WifiOff } from 'lucide-react';
import useAuthStore from '../stores/authStore';
import { io } from 'socket.io-client';

const ProjectChat = ({ projectId }) => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [typingUsers, setTypingUsers] = useState(new Set());
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Socket connection
  useEffect(() => {
    const socketUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
    console.log('🌐 Connecting to:', socketUrl);
    
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: true
    });

    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      setConnectionStatus('connected');
      
      // Join project room after connection
      if (projectId) {
        newSocket.emit('join-project', projectId);
      }
    });

    newSocket.on('disconnect', (reason) => {
      setIsConnected(false);
      setConnectionStatus('disconnected');
    });

    newSocket.on('connect_error', (error) => {
      console.error(' Socket connection error:', error);
      setConnectionStatus('error');
    });

    newSocket.on('previous-messages', (previousMessages) => {
      setMessages(previousMessages);
    });

    newSocket.on('new-message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('user-typing', (data) => {
      setTypingUsers(prev => new Set(prev).add(data.userName));
    });

    newSocket.on('user-stopped-typing', (data) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.userName);
        return newSet;
      });
    });

    newSocket.on('error', (error) => {
      console.error(' Socket error:', error);
    });

    // Test connection
    newSocket.emit('ping', { test: 'connection' });
    newSocket.on('pong', (data) => {
      console.log(' Pong received:', data);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [projectId]);

  // Handle typing indicators
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);

    if (!socket || !isConnected) return;

    // Start typing indicator
    if (!typingTimeoutRef.current) {
      socket.emit('typing-start', {
        projectId,
        userId: user._id,
        userName: user.name
      });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing-stop', {
        projectId,
        userId: user._id
      });
      typingTimeoutRef.current = null;
    }, 1000);
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !socket || !isConnected) {
      console.log('Cannot send message:', { 
        hasMessage: !!newMessage.trim(), 
        hasSocket: !!socket, 
        isConnected 
      });
      return;
    }

    const messageData = {
      projectId,
      sender: user,
      content: newMessage.trim()
    };

    socket.emit('send-message', messageData);
    setNewMessage('');

    // Clear typing indicator
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      socket.emit('typing-stop', {
        projectId,
        userId: user._id
      });
      typingTimeoutRef.current = null;
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isOwnMessage = (senderId) => {
    return senderId === user._id;
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'text-green-500';
      case 'disconnected': return 'text-red-500';
      case 'error': return 'text-orange-500';
      default: return 'text-gray-500';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'disconnected': return 'Disconnected';
      case 'error': return 'Connection Error';
      default: return 'Connecting...';
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg border border-gray-200">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-lg">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">Project Chat</h3>
          <div className="flex items-center space-x-2">
            {isConnected ? (
              <Wifi className="w-4 h-4 text-green-500" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-500" />
            )}
            <span className={`text-sm ${getConnectionStatusColor()}`}>
              {getConnectionStatusText()}
            </span>
          </div>
        </div>
        {typingUsers.size > 0 && (
          <div className="text-sm text-gray-500 italic">
            {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
          </div>
        )}
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {!isConnected && (
          <div className="text-center text-orange-500 py-4 bg-orange-50 rounded-lg">
            <p>Connecting to chat server...</p>
          </div>
        )}
        
        {messages.length === 0 && isConnected ? (
          <div className="text-center text-gray-500 py-8">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message._id}
              className={`flex ${isOwnMessage(message.sender._id) ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                  isOwnMessage(message.sender._id)
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                }`}
              >
                {!isOwnMessage(message.sender._id) && (
                  <p className="text-xs font-semibold text-blue-600 mb-1">
                    {message.sender.name}
                  </p>
                )}
                <p className="text-sm break-words">{message.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    isOwnMessage(message.sender._id)
                      ? 'text-blue-100'
                      : 'text-gray-500'
                  }`}
                >
                  {formatTime(message.createdAt)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200 bg-white rounded-b-lg">
        <form onSubmit={handleSendMessage} className="flex space-x-2">
          <div className="flex-1 relative">
            <input
              type="text"
              value={newMessage}
              onChange={handleInputChange}
              placeholder={isConnected ? "Type your message..." : "Connecting..."}
              disabled={!isConnected}
              className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            />
            
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim() || !isConnected}
            className="px-4 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ProjectChat;