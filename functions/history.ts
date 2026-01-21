
import postgres from 'postgres';

let sql: any;

function getSql() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    throw new Error("DATABASE_URL is not configured. Please add it to your environment variables.");
  }
  
  if (!sql) {
    sql = postgres(dbUrl, {
      ssl: 'require',
      connect_timeout: 10,
      idle_timeout: 20,
      max: 1
    });
  }
  return sql;
}

export const handler = async (event: any) => {
  const method = event.httpMethod;
  const headers = { 
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (method === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  try {
    const db = getSql();

    if (method === 'GET') {
      try {
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
          headers,
          body: JSON.stringify(entries),
        };
      } catch (dbError: any) {
        if (dbError.message.includes('does not exist')) {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify([]),
          };
        }
        throw dbError;
      }
    }

    if (method === 'POST') {
      const data = JSON.parse(event.body);
      await db`
        INSERT INTO history_entries (
          id, ricefw_id, fs_name, transaction_id, region, status, version, release_reference, author, change_description, timestamp, document_date
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
          ${BigInt(data.timestamp || Date.now())}, 
          ${data.documentDate ? BigInt(data.documentDate) : BigInt(data.timestamp || Date.now())}
        )
      `;
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ message: 'Success' }),
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
        headers,
        body: JSON.stringify({ message: 'Updated' }),
      };
    }

    return { 
      statusCode: 405, 
      headers,
      body: JSON.stringify({ error: `Method ${method} Not Allowed` }) 
    };
  } catch (error: any) {
    console.error('API Error:', error.message);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message || "Database request failed",
        detail: "Ensure DATABASE_URL is correct and the 'history_entries' table is migrated."
      }),
    };
  }
};
