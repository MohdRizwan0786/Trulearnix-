import { Server, Socket } from 'socket.io';

export const initSocketHandlers = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    console.log('Socket connected:', socket.id);

    // Join class room
    socket.on('join-class', ({ classId, userId, userName }) => {
      socket.join(`class:${classId}`);
      socket.to(`class:${classId}`).emit('user-joined', { userId, userName });
      console.log(`${userName} joined class ${classId}`);
    });

    // Live class chat
    socket.on('class-message', ({ classId, userId, userName, message }) => {
      io.to(`class:${classId}`).emit('new-message', {
        userId, userName, message, timestamp: new Date()
      });
    });

    // Leave class room
    socket.on('leave-class', ({ classId, userId, userName }) => {
      socket.leave(`class:${classId}`);
      socket.to(`class:${classId}`).emit('user-left', { userId, userName });
    });

    // Raise hand in class
    socket.on('raise-hand', ({ classId, userId, userName }) => {
      io.to(`class:${classId}`).emit('hand-raised', { userId, userName });
    });

    // Notification room
    socket.on('join-notifications', ({ userId }) => {
      socket.join(`user:${userId}`);
    });

    // WebRTC signaling
    socket.on('webrtc-offer', ({ classId, offer, senderId }) => {
      socket.to(`class:${classId}`).emit('webrtc-offer', { offer, senderId });
    });

    socket.on('webrtc-answer', ({ classId, answer, senderId }) => {
      socket.to(`class:${classId}`).emit('webrtc-answer', { answer, senderId });
    });

    socket.on('webrtc-ice-candidate', ({ classId, candidate, senderId }) => {
      socket.to(`class:${classId}`).emit('webrtc-ice-candidate', { candidate, senderId });
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
    });
  });
};

export const sendNotificationToUser = (io: Server, userId: string, notification: object) => {
  io.to(`user:${userId}`).emit('notification', notification);
};
