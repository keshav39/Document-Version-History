
import postgres from 'postgres';

// Initialize SQL connection lazily
let sql: any;

function getSql() {
  if (!sql) {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error("DATABASE_URL environment variable is not defined in Netlify settings.");
    }
    sql = postgres(dbUrl, {
      ssl: 'require',
      connect_timeout: 10,
    });
  }
  return sql;
}

export const handler = async (event: any) => {
  const method = event.httpMethod;

  try {
    // Ensure the database connection is initialized within the try block
    const db = getSql();

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
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*' 
        },
        body: JSON.stringify(entries),
      };
    }

    if (method === 'POST') {
      const data = JSON.parse(event.body);
      
      console.log("Inserting entry:", data.RICEFWID);

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
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*' 
        },
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
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*' 
        },
        body: JSON.stringify({ message: 'Status updated successfully' }),
      };
    }

    return { 
      statusCode: 405, 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' }) 
    };
  } catch (error: any) {
    console.error('Function Error:', error.message);

    return {
      statusCode: 500,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*' 
      },
      body: JSON.stringify({ 
        error: error.message || "Internal Server Error",
        detail: "Check if DATABASE_URL is set and the 'document_date' column (BIGINT) exists in your 'history_entries' table."
      }),
    };
  }
};
