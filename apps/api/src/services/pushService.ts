import webpush from 'web-push'
import PushSubscription from '../models/PushSubscription'
import Notification from '../models/Notification'
import mongoose from 'mongoose'

webpush.setVapidDetails(
  process.env.VAPID_EMAIL || 'mailto:admin@trulearnix.com',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
)

export interface PushPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  url?: string
  tag?: string
  type?: string
  sound?: boolean
}

// Send push notification to a single user
export async function sendPushToUser(userId: string | mongoose.Types.ObjectId, payload: PushPayload) {
  const subs = await PushSubscription.find({ user: userId })
  if (!subs.length) return

  const data = JSON.stringify({
    title:  payload.title,
    body:   payload.body,
    icon:   payload.icon  || '/logo.png',
    badge:  payload.badge || '/badge.png',
    url:    payload.url   || '/',
    tag:    payload.tag   || 'default',
    type:   payload.type  || 'info',
    sound:  payload.sound !== false,
    timestamp: Date.now(),
  })

  const results = await Promise.allSettled(
    subs.map(sub =>
      webpush.sendNotification(
        { endpoint: sub.endpoint, keys: sub.keys },
        data,
        { TTL: 86400 }
      ).catch(async (err: any) => {
        // Remove expired/invalid subscriptions
        if (err.statusCode === 410 || err.statusCode === 404) {
          await PushSubscription.deleteOne({ _id: sub._id })
        }
        throw err
      })
    )
  )
  return results
}

// Send push to multiple users
export async function sendPushToUsers(userIds: (string | mongoose.Types.ObjectId)[], payload: PushPayload) {
  return Promise.allSettled(userIds.map(uid => sendPushToUser(uid, payload)))
}

// Send push to users by role
export async function sendPushByRole(roles: string[], payload: PushPayload) {
  const User = (await import('../models/User')).default
  const users = await User.find({ role: { $in: roles }, isActive: true }).select('_id')
  return sendPushToUsers(users.map(u => u._id), payload)
}

// Save in-app notification AND send push
export async function notify(
  userId: string | mongoose.Types.ObjectId,
  title: string,
  message: string,
  options: {
    type?: string
    url?: string
    tag?: string
    data?: Record<string, any>
  } = {}
) {
  // Save to DB
  try {
    await Notification.create({
      user:      userId,
      title,
      message,
      type:      options.type || 'info',
      channel:   'inapp',
      actionUrl: options.url,
      data:      options.data,
    })
  } catch {}

  // Real-time socket handled separately via socket.io; skip here

  // Web push
  try {
    await sendPushToUser(userId, {
      title,
      body:  message,
      url:   options.url || '/',
      tag:   options.tag,
      type:  options.type,
      sound: true,
    })
  } catch {}
}

export default { sendPushToUser, sendPushToUsers, sendPushByRole, notify }
