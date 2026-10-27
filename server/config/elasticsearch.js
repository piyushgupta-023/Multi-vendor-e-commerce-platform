const { Client } = require('@elastic/elasticsearch');

let esClient = null;
let isConnected = false;

const createESClient = async () => {
  try {
    const client = new Client({
      node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
      requestTimeout: 3000,
      sniffOnStart: false,
    });
    await client.ping();
    esClient = client;
    isConnected = true;
    console.log('✅ Elasticsearch Connected');
    await ensureProductIndex();
  } catch (err) {
    console.warn('⚠️  Elasticsearch unavailable, search will fall back to MongoDB');
  }
};

const ensureProductIndex = async () => {
  try {
    const exists = await esClient.indices.exists({ index: 'products' });
    if (!exists) {
      await esClient.indices.create({
        index: 'products',
        body: {
          mappings: {
            properties: {
              name: { type: 'text', analyzer: 'standard' },
              description: { type: 'text' },
              category: { type: 'keyword' },
              subcategory: { type: 'keyword' },
              tags: { type: 'keyword' },
              price: { type: 'float' },
              vendorId: { type: 'keyword' },
              storeName: { type: 'keyword' },
              isActive: { type: 'boolean' },
              ratings: {
                properties: {
                  average: { type: 'float' },
                  count: { type: 'integer' },
                }
              }
            }
          }
        }
      });
      console.log('✅ Elasticsearch products index created');
    }
  } catch (err) {
    console.warn('⚠️  Could not ensure ES index:', err.message);
  }
};

createESClient();

module.exports = {
  getClient: () => esClient,
  isESConnected: () => isConnected,
};
