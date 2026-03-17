'use client';

export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) return false;

  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

export function scheduleNotification(title: string, body: string, delayMs: number) {
  if (typeof window === 'undefined' || Notification.permission !== 'granted') return;

  setTimeout(() => {
    new Notification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: `reentry-${Date.now()}`,
    });
  }, delayMs);
}

export function scheduleDeadlineReminders(deadlines: Array<{ title: string; dueDate: string }>) {
  if (typeof window === 'undefined' || Notification.permission !== 'granted') return;

  const now = Date.now();

  for (const deadline of deadlines) {
    const dueTime = new Date(deadline.dueDate).getTime();
    const daysUntil = Math.floor((dueTime - now) / (1000 * 60 * 60 * 24));

    // Remind at 7 days, 3 days, 1 day, and day-of
    const reminders = [
      { days: 7, msg: `${deadline.title} is in 7 days` },
      { days: 3, msg: `${deadline.title} is in 3 days — prepare now` },
      { days: 1, msg: `${deadline.title} is TOMORROW` },
      { days: 0, msg: `${deadline.title} is TODAY` },
    ];

    for (const reminder of reminders) {
      if (daysUntil === reminder.days) {
        scheduleNotification('REENTRY Reminder', reminder.msg, 0);
      }
    }
  }
}

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}
