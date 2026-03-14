import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(__dirname, '../subscribers.json');

export interface Subscriber {
  chatId: number;
  joinedAt: string;
}

export class Database {
  private subscribers: Subscriber[] = [];

  constructor() {
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const data = fs.readFileSync(DB_FILE, 'utf8');
        this.subscribers = JSON.parse(data);
      } else {
        this.save();
      }
    } catch (e) {
      console.error('Failed to load DB', e);
    }
  }

  private save() {
    fs.writeFileSync(DB_FILE, JSON.stringify(this.subscribers, null, 2));
  }

  public addSubscriber(chatId: number) {
    if (!this.subscribers.find(s => s.chatId === chatId)) {
      this.subscribers.push({
        chatId,
        joinedAt: new Date().toISOString()
      });
      this.save();
      return true;
    }
    return false;
  }

  public removeSubscriber(chatId: number) {
    const initialLen = this.subscribers.length;
    this.subscribers = this.subscribers.filter(s => s.chatId !== chatId);
    if (this.subscribers.length < initialLen) {
      this.save();
      return true;
    }
    return false;
  }

  public getSubscribers() {
    return this.subscribers.map(s => s.chatId);
  }
}

export const db = new Database();
