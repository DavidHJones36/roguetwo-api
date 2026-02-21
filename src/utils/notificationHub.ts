import {
  NotificationHubsClient,
  createBrowserInstallation,
} from '@azure/notification-hubs';

const NH_CONNECTION_STRING = process.env.NOTIFICATION_HUB_CONNECTION_STRING;
const NH_NAME = process.env.NOTIFICATION_HUB_NAME;

// Only initialize if configured
const nhClient =
  NH_CONNECTION_STRING && NH_NAME
    ? new NotificationHubsClient(NH_CONNECTION_STRING, NH_NAME)
    : null;

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  url?: string;
  tag?: string;
  eventId?: number;
  actions?: Array<{
    action: string;
    title: string;
  }>;
}

export async function registerPushSubscription(
  userId: string,
  subscription: PushSubscription,
) {
  if (!nhClient) {
    console.warn('Notification Hub not configured, skipping push registration');
    return { success: false, reason: 'not configured' };
  }

  const installation = createBrowserInstallation({
    installationId: userId,
    pushChannel: {
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    },
    tags: [`user:${userId}`],
  });

  const response = await nhClient.createOrUpdateInstallation(installation);
  console.log('Registered with Notification Hub:', response);

  return { success: true, installationId: userId };
}

export async function unregisterPushSubscription(userId: string) {
  if (!nhClient) {
    console.warn(
      'Notification Hub not configured, skipping push unregistration',
    );
    return { success: false, reason: 'not configured' };
  }

  await nhClient.deleteInstallation(userId);
  return { success: true };
}

export async function sendPushNotification(
  userId: string,
  payload: NotificationPayload,
) {
  if (!nhClient) {
    console.warn('Notification Hub not configured, skipping push notification');
    return { success: false, reason: 'not configured' };
  }

  const webPushPayload = {
    notification: {
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/favicon.ico',
      badge: '/favicon.ico',
      tag: payload.tag || 'default',
      data: {
        url: payload.url || '/',
        eventId: payload.eventId,
      },
      actions: payload.actions || [],
    },
  };

  const result = await nhClient.sendNotification(
    {
      platform: 'browser',
      body: JSON.stringify(webPushPayload),
      contentType: 'application/json;charset=utf-8',
    },
    {
      tagExpression: `user:${userId}`,
    },
  );

  return {
    success: true,
    notificationId: result.notificationId,
    state: result.state,
  };
}

export async function sendPushToMultipleUsers(
  userIds: string[],
  payload: NotificationPayload,
) {
  if (!nhClient) {
    console.warn(
      'Notification Hub not configured, skipping push notifications',
    );
    return { success: false, reason: 'not configured' };
  }

  const tagExpression = userIds.map((id) => `user:${id}`).join(' || ');

  const webPushPayload = {
    notification: {
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/favicon.ico',
      badge: '/favicon.ico',
      tag: payload.tag || 'default',
      data: {
        url: payload.url || '/',
        eventId: payload.eventId,
      },
      actions: payload.actions || [],
    },
  };

  const result = await nhClient.sendNotification(
    {
      platform: 'browser',
      body: JSON.stringify(webPushPayload),
      contentType: 'application/json;charset=utf-8',
    },
    {
      tagExpression,
    },
  );

  return {
    success: true,
    notificationId: result.notificationId,
    state: result.state,
  };
}
