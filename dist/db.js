"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.Database = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const DB_FILE = path_1.default.join(__dirname, '../subscribers.json');
class Database {
    subscribers = [];
    constructor() {
        this.load();
    }
    load() {
        try {
            if (fs_1.default.existsSync(DB_FILE)) {
                const data = fs_1.default.readFileSync(DB_FILE, 'utf8');
                this.subscribers = JSON.parse(data);
            }
            else {
                this.save();
            }
        }
        catch (e) {
            console.error('Failed to load DB', e);
        }
    }
    save() {
        fs_1.default.writeFileSync(DB_FILE, JSON.stringify(this.subscribers, null, 2));
    }
    addSubscriber(chatId) {
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
    removeSubscriber(chatId) {
        const initialLen = this.subscribers.length;
        this.subscribers = this.subscribers.filter(s => s.chatId !== chatId);
        if (this.subscribers.length < initialLen) {
            this.save();
            return true;
        }
        return false;
    }
    getSubscribers() {
        return this.subscribers.map(s => s.chatId);
    }
}
exports.Database = Database;
exports.db = new Database();
