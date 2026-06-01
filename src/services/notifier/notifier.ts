import { execSync } from 'node:child_process';

export interface Notification {
  title: string;
  body: string;
  urgency?: 'low' | 'normal' | 'critical';
}

export class Notifier {
  send(notification: Notification): boolean {
    try {
      if (process.platform === 'win32') {
        // Windows: use PowerShell
        const escaped = notification.body.replace(/'/g, "''");
        execSync(`powershell -NoProfile -Command "New-BurntToastNotification -Text '${notification.title}', '${escaped}'"`, { timeout: 5000 });
        return true;
      } else if (process.platform === 'darwin') {
        // macOS: use osascript
        execSync(`osascript -e 'display notification "${notification.body}" with title "${notification.title}"'`, { timeout: 5000 });
        return true;
      } else {
        // Linux: use notify-send
        execSync(`notify-send "${notification.title}" "${notification.body}"`, { timeout: 5000 });
        return true;
      }
    } catch {
      return false;
    }
  }

  taskComplete(taskName: string): boolean {
    return this.send({
      title: 'MiMo Code',
      body: `Task completed: ${taskName}`,
      urgency: 'normal',
    });
  }

  error(message: string): boolean {
    return this.send({
      title: 'MiMo Code - Error',
      body: message,
      urgency: 'critical',
    });
  }
}

export const notifier = new Notifier();
