import { ToolStorage, SessionStorage, StorageType, SessionMemory } from "./types";
import { Pool, PoolClient } from 'pg';

export class PostgresStorage implements ToolStorage, SessionStorage {
  private pool: Pool;
  private isInitialized: boolean = false;

  constructor(connectionString?: string) {
    if (!connectionString) {
      // Use environment variables as fallback
      connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    }

    if (!connectionString) {
      throw new Error("PostgreSQL connection string is required. Provide it via constructor parameter, DATABASE_URL, or POSTGRES_URL environment variable.");
    }

    this.pool = new Pool({
      connectionString,
      max: 20, // Maximum number of clients in the pool
      idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
      connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
    });

    // Initialize database schema on first connection
    this.initializeSchema().catch(console.error);
  }

  private async initializeSchema(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const client = await this.pool.connect();
      
      try {
        // Create tool_results table
        await client.query(`
          CREATE TABLE IF NOT EXISTS delreact_tool_results (
            id SERIAL PRIMARY KEY,
            reference VARCHAR(255) UNIQUE NOT NULL,
            tool_name VARCHAR(100) NOT NULL,
            session_id VARCHAR(100) NOT NULL,
            result_data JSONB NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Create session_memory table
        await client.query(`
          CREATE TABLE IF NOT EXISTS delreact_session_memory (
            id SERIAL PRIMARY KEY,
            session_id VARCHAR(100) UNIQUE NOT NULL,
            session_data JSONB NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
          )
        `);

        // Create indexes for better performance
        await client.query(`
          CREATE INDEX IF NOT EXISTS idx_tool_results_reference ON delreact_tool_results(reference);
          CREATE INDEX IF NOT EXISTS idx_tool_results_session_id ON delreact_tool_results(session_id);
          CREATE INDEX IF NOT EXISTS idx_tool_results_tool_name ON delreact_tool_results(tool_name);
          CREATE INDEX IF NOT EXISTS idx_session_memory_session_id ON delreact_session_memory(session_id);
        `);

        // Create trigger for updated_at timestamp
        await client.query(`
          CREATE OR REPLACE FUNCTION update_updated_at_column()
          RETURNS TRIGGER AS $$
          BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
          END;
          $$ language 'plpgsql';
        `);

        await client.query(`
          DROP TRIGGER IF EXISTS update_delreact_tool_results_updated_at ON delreact_tool_results;
          CREATE TRIGGER update_delreact_tool_results_updated_at 
            BEFORE UPDATE ON delreact_tool_results 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        `);

        await client.query(`
          DROP TRIGGER IF EXISTS update_delreact_session_memory_updated_at ON delreact_session_memory;
          CREATE TRIGGER update_delreact_session_memory_updated_at 
            BEFORE UPDATE ON delreact_session_memory 
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
        `);

        this.isInitialized = true;
        console.log("[PostgreSQL] Schema initialized successfully");
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("[PostgreSQL] Failed to initialize schema:", error);
      throw error;
    }
  }

  getStorageType(): StorageType {
    return "postgresql";
  }

  generateReference(toolName: string, sessionId: string): string {
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    return `@postgresql_${toolName}_${sessionId}_${uniqueId}`;
  }

  async store(toolName: string, sessionId: string, toolResult: any): Promise<string> {
    await this.initializeSchema(); // Ensure schema is ready
    
    const reference = this.generateReference(toolName, sessionId);
    
    try {
      const client = await this.pool.connect();
      
      try {
        const query = `
          INSERT INTO delreact_tool_results (reference, tool_name, session_id, result_data) 
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (reference) DO UPDATE SET
            result_data = EXCLUDED.result_data,
            updated_at = CURRENT_TIMESTAMP
        `;
        
        await client.query(query, [reference, toolName, sessionId, JSON.stringify(toolResult)]);
        console.log(`[PostgreSQL] Stored ${reference} for tool ${toolName}`);
        return reference;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(`[PostgreSQL] Failed to store ${reference}:`, error);
      throw error;
    }
  }

  async retrieve(reference: string): Promise<any | null> {
    await this.initializeSchema(); // Ensure schema is ready
    
    try {
      const client = await this.pool.connect();
      
      try {
        const query = 'SELECT result_data FROM delreact_tool_results WHERE reference = $1';
        const result = await client.query(query, [reference]);
        
        if (result.rows.length === 0) {
          console.log(`[PostgreSQL] Retrieved ${reference}: not found`);
          return null;
        }
        
        const toolResult = JSON.parse(result.rows[0].result_data);
        console.log(`[PostgreSQL] Retrieved ${reference}: found`);
        return toolResult;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(`[PostgreSQL] Failed to retrieve ${reference}:`, error);
      return null;
    }
  }

  async storeSession(sessionMemory: SessionMemory): Promise<void> {
    await this.initializeSchema(); // Ensure schema is ready
    
    try {
      const client = await this.pool.connect();
      
      try {
        const query = `
          INSERT INTO delreact_session_memory (session_id, session_data) 
          VALUES ($1, $2)
          ON CONFLICT (session_id) DO UPDATE SET
            session_data = EXCLUDED.session_data,
            updated_at = CURRENT_TIMESTAMP
        `;
        
        const sessionData = {
          ...sessionMemory,
          lastUpdated: Date.now()
        };
        
        await client.query(query, [sessionMemory.sessionId, JSON.stringify(sessionData)]);
        console.log(`[PostgreSQL] Session stored: ${sessionMemory.sessionId}`);
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(`[PostgreSQL] Failed to store session ${sessionMemory.sessionId}:`, error);
      throw error;
    }
  }

  async retrieveSession(sessionId: string): Promise<SessionMemory | null> {
    await this.initializeSchema(); // Ensure schema is ready
    
    try {
      const client = await this.pool.connect();
      
      try {
        const query = 'SELECT session_data FROM delreact_session_memory WHERE session_id = $1';
        const result = await client.query(query, [sessionId]);
        
        if (result.rows.length === 0) {
          console.log(`[PostgreSQL] Session retrieved: ${sessionId} - not found`);
          return null;
        }
        
        const sessionMemory = JSON.parse(result.rows[0].session_data);
        console.log(`[PostgreSQL] Session retrieved: ${sessionId} - found`);
        return sessionMemory;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error(`[PostgreSQL] Failed to retrieve session ${sessionId}:`, error);
      return null;
    }
  }

  // Utility methods for management
  async getStorageStats(): Promise<{ toolResults: number; sessions: number }> {
    await this.initializeSchema();
    
    try {
      const client = await this.pool.connect();
      
      try {
        const toolResultsQuery = 'SELECT COUNT(*) as count FROM delreact_tool_results';
        const sessionsQuery = 'SELECT COUNT(*) as count FROM delreact_session_memory';
        
        const [toolResults, sessions] = await Promise.all([
          client.query(toolResultsQuery),
          client.query(sessionsQuery)
        ]);
        
        return {
          toolResults: parseInt(toolResults.rows[0].count),
          sessions: parseInt(sessions.rows[0].count)
        };
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('[PostgreSQL] Failed to get storage stats:', error);
      return { toolResults: 0, sessions: 0 };
    }
  }

  async clearExpiredSessions(expirationDays: number = 30): Promise<number> {
    await this.initializeSchema();
    
    try {
      const client = await this.pool.connect();
      
      try {
        const query = `
          DELETE FROM delreact_session_memory 
          WHERE updated_at < NOW() - INTERVAL '${expirationDays} days'
        `;
        
        const result = await client.query(query);
        const deletedCount = result.rowCount || 0;
        
        console.log(`[PostgreSQL] Cleared ${deletedCount} expired sessions`);
        return deletedCount;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('[PostgreSQL] Failed to clear expired sessions:', error);
      return 0;
    }
  }

  async clearExpiredToolResults(expirationDays: number = 7): Promise<number> {
    await this.initializeSchema();
    
    try {
      const client = await this.pool.connect();
      
      try {
        const query = `
          DELETE FROM delreact_tool_results 
          WHERE created_at < NOW() - INTERVAL '${expirationDays} days'
        `;
        
        const result = await client.query(query);
        const deletedCount = result.rowCount || 0;
        
        console.log(`[PostgreSQL] Cleared ${deletedCount} expired tool results`);
        return deletedCount;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error('[PostgreSQL] Failed to clear expired tool results:', error);
      return 0;
    }
  }

  async closeConnections(): Promise<void> {
    try {
      await this.pool.end();
      console.log('[PostgreSQL] Connection pool closed');
    } catch (error) {
      console.error('[PostgreSQL] Error closing connection pool:', error);
    }
  }

  // Test connection method
  async testConnection(): Promise<boolean> {
    try {
      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      console.log('[PostgreSQL] Connection test successful');
      return true;
    } catch (error) {
      console.error('[PostgreSQL] Connection test failed:', error);
      return false;
    }
  }
} 