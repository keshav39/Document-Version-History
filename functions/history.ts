
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!, {
  ssl: 'require'
});

export const handler = async (event: any) => {
  const method = event.httpMethod;

  try {
    if (method === 'GET') {
      const entries = await sql`
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
          timestamp 
        FROM history_entries 
        ORDER BY timestamp DESC
      `;
      return {
        statusCode: 200,
        body: JSON.stringify(entries),
      };
    }

    if (method === 'POST') {
      const data = JSON.parse(event.body);
      await sql`
        INSERT INTO history_entries (
          id, ricefw_id, fs_name, transaction_id, region, status, version, release_reference, author, change_description, timestamp
        ) VALUES (
          ${data.id}, ${data.RICEFWID}, ${data.FSNAME}, ${data.TransactionID}, ${data.Region}, ${data.Status}, ${data.version}, ${data.releaseReference}, ${data.author}, ${data.changeDescription}, ${data.timestamp}
        )
      `;
      return {
        statusCode: 201,
        body: JSON.stringify({ message: 'Entry saved successfully' }),
      };
    }

    return { statusCode: 405, body: 'Method Not Allowed' };
  } catch (error: any) {
    console.error('Database Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
