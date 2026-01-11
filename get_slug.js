const { createClient } = require('@libsql/client');
const client = createClient({ url: 'file:dev.db' });
async function run() {
    const result = await client.execute('SELECT slug FROM catalogs LIMIT 1');
    console.log(result.rows[0]?.slug);
}
run();
