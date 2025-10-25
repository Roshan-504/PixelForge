import { Server } from 'socket.io';
import Project from '../models/Project.js';
import Message from '../models/Message.js';

const setupSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || "http://localhost:5173",
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling'] 
  });


  // Store online users
  const onlineUsers = new Map();

  io.on('connection', (socket) => {

    // Handle join project
    socket.on('join-project', async (projectId) => {
      if (!projectId) {
        socket.emit('error', 'Project ID is required');
        return;
      }

      try {
        socket.join(projectId);
        
        // Send previous messages
        const messages = await Message.find({ projectId })
          .populate('sender', 'name email')
          .sort({ createdAt: 1 })
          .limit(50);
        
        socket.emit('previous-messages', messages);
        
      } catch (error) {
        console.error('Error fetching messages:', error);
        socket.emit('error', 'Failed to load messages');
      }
    });

    // Handle new message
    socket.on('send-message', async (data) => {
      try {
        const { projectId, sender, content } = data;
        
        if (!projectId || !sender || !content) {
          socket.emit('error', 'Missing required fields');
          return;
        }

        // Verify user has access to project
        const project = await Project.findById(projectId);
        if (!project) {
          socket.emit('error', 'Project not found');
          return;
        }

        // Check if user is part of project team or lead
        const isTeamMember = project.team.some(member => 
          member.userId.toString() === sender._id
        );
        const isLead = project.lead.toString() === sender._id;

        const isAdmin = sender.role == 'admin';
        
        if (!isTeamMember && !isLead && !isAdmin) {
          socket.emit('error', 'Not authorized to send messages in this project');
          return;
        }

        // Save message to database
        const message = new Message({
          projectId,
          sender: sender._id,
          content: content.trim(),
          type: 'text'
        });

        await message.save();
        
        // Populate sender info
        await message.populate('sender', 'name email');


        // Broadcast to all users in the project room
        io.to(projectId).emit('new-message', message);
        
      } catch (error) {
        console.error(' Error sending message:', error);
        socket.emit('error', 'Failed to send message');
      }
    });

    // Handle user typing
    socket.on('typing-start', (data) => {
      socket.to(data.projectId).emit('user-typing', {
        userId: data.userId,
        userName: data.userName
      });
    });

    socket.on('typing-stop', (data) => {
      socket.to(data.projectId).emit('user-stopped-typing', {
        userId: data.userId
      });
    });

    // Handle connection testing
    socket.on('ping', (data) => {
      socket.emit('pong', { ...data, serverTime: new Date().toISOString() });
    });

    // Handle disconnect
    socket.on('disconnect', (reason) => {
      for (let [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          break;
        }
      }
    });
  });

  return io;
};

export default setupSocket;