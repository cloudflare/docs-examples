import { D1Database } from '@cloudflare/workers-types';
import { ImageRecord } from '../types';

export class DatabaseService {
  constructor(private db: D1Database) {}

  async insertImage(imageKey: string, instanceId: string): Promise<void> {
    try {
      await this.db
        .prepare('INSERT INTO Images (ImageKey, InstanceID) VALUES (?, ?)')
        .bind(imageKey, instanceId)
        .run();
    } catch (error) {
      throw new Error(`Failed to insert image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateImageTags(instanceId: string, tags: string): Promise<void> {
    try {
      await this.db
        .prepare('UPDATE Images SET ImageTags = ? WHERE InstanceID = ?')
        .bind(tags, instanceId)
        .run();
    } catch (error) {
      throw new Error(`Failed to update image tags: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getImageTags(instanceId: string): Promise<string | null> {
    try {
      const result = await this.db
        .prepare('SELECT ImageTags FROM Images WHERE InstanceID = ?')
        .bind(instanceId)
        .first<ImageRecord>();

      return result?.ImageTags || null;
    } catch (error) {
      throw new Error(`Failed to get image tags: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
