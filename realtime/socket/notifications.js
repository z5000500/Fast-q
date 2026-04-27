const { getPool } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// userId -> Set<socketId>  (one user can have multiple tabs)
const userSockets = new Map();

function registerNotificationHandlers(namespace, socket) {
  const userId = socket.user?.sub;
  if (!userId) return;

  // Track this socket for the user
  if (!userSockets.has(userId)) {
    userSockets.set(userId, new Set());
  }
  userSockets.get(userId).add(socket.id);

  // Join a user-specific room for targeted pushes
  socket.join(`user:${userId}`);

  // Send unread count on connect
  sendUnreadCount(socket, userId);

  socket.on('disconnect', () => {
    const sockets = userSockets.get(userId);
    if (sockets) {
      sockets.delete(socket.id);
      if (sockets.size === 0) userSockets.delete(userId);
    }
  });
}

async function sendUnreadCount(socket, userId) {
  try {
    const pool = getPool();
    const [rows] = await pool.query(
      'SELECT COUNT(*) as cnt FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId]
    );
    socket.emit('server:unread-count', { count: rows[0].cnt });
  } catch {
    // ignore
  }
}

/**
 * Push a notification to a specific user in real-time.
 * Called from other socket handlers or externally.
 */
async function pushNotification(namespace, userId, notification) {
  try {
    const pool = getPool();
    const id = uuidv4();
    await pool.query(
      `INSERT INTO notifications (id, user_id, type, title, message, data)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, userId, notification.type || 'system', notification.title, notification.message || null, notification.data ? JSON.stringify(notification.data) : null]
    );

    const payload = {
      id,
      userId,
      type: notification.type || 'system',
      title: notification.title,
      message: notification.message || null,
      data: notification.data || null,
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    namespace.to(`user:${userId}`).emit('server:notification', payload);
  } catch {
    // Silently fail
  }
}

module.exports = { registerNotificationHandlers, pushNotification };
