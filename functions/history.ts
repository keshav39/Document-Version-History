
import postgres from 'postgres';

// Initialize SQL connection lazily to handle missing ENV variables gracefully
let sql: any;

function getSql() {
  if (!sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is not defined");
    }
    sql = postgres(process.env.DATABASE_URL, {
      ssl: 'require',
      connect_timeout: 10,
    });
  }
  return sql;
}

export const handler = async (event: any) => {
  const method = event.httpMethod;
  const db = getSql();

  try {
    if (method === 'GET') {
      const entries = await db`
        SELECT 
          id, 
          ricefw_id as "RICEFWID", 
          fs_name as "FSNAME", 
          transaction_id as "TransactionID", 
          region as "Region", 
          status as "Status", 
          version, 
          release_reference as "releaseReference", 
          author, 
          change_description as "changeDescription", 
          timestamp,
          document_date as "documentDate"
        FROM history_entries 
        ORDER BY timestamp DESC
      `;
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entries),
      };
    }

    if (method === 'POST') {
      const data = JSON.parse(event.body);
      
      // Detailed logging for debugging
      console.log("Attempting to insert entry:", data.RICEFWID, "v" + data.version);

      await db`
        INSERT INTO history_entries (
          id, 
          ricefw_id, 
          fs_name, 
          transaction_id, 
          region, 
          status, 
          version, 
          release_reference, 
          author, 
          change_description, 
          timestamp, 
          document_date
        ) VALUES (
          ${data.id}, 
          ${data.RICEFWID}, 
          ${data.FSNAME}, 
          ${data.TransactionID || ''}, 
          ${data.Region || ''}, 
          ${!!data.Status}, 
          ${data.version}, 
          ${data.releaseReference || ''}, 
          ${data.author || 'Unknown'}, 
          ${data.changeDescription || ''}, 
          ${BigInt(data.timestamp)}, 
          ${data.documentDate ? BigInt(data.documentDate) : BigInt(data.timestamp)}
        )
      `;

      return {
        statusCode: 201,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Entry saved successfully' }),
      };
    }

    if (method === 'PATCH') {
      const { id, status } = JSON.parse(event.body);
      await db`
        UPDATE history_entries 
        SET status = ${!!status}
        WHERE id = ${id}
      `;
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Status updated successfully' }),
      };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (error: any) {
    // CRITICAL: Log the actual error to Netlify function logs
    console.error('Database Operation Failed:', error.message);
    console.error('Full Error Object:', error);

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        error: error.message,
        detail: "Ensure your database has the 'document_date' column (BIGINT) and table 'history_entries' exists."
      }),
    };
  }
};
