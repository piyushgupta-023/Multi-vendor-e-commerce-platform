const { getClient, isESConnected } = require('../config/elasticsearch');

const indexProduct = async (product, storeName) => {
  if (!isESConnected()) return false;
  try {
    const esClient = getClient();
    await esClient.index({
      index: 'products',
      id: product._id.toString(),
      document: {
        name: product.name,
        description: product.description,
        category: product.category,
        subcategory: product.subcategory,
        tags: product.tags,
        price: product.price,
        vendorId: product.vendorId.toString(),
        storeName: storeName || '',
        isActive: product.isActive,
        ratings: product.ratings,
      },
    });
    return true;
  } catch (err) {
    console.warn('ES indexProduct failed:', err.message);
    return false;
  }
};

const updateProductInES = async (productId, updates) => {
  if (!isESConnected()) return false;
  try {
    const esClient = getClient();
    await esClient.update({ index: 'products', id: productId.toString(), doc: updates });
    return true;
  } catch (err) {
    console.warn('ES updateProduct failed:', err.message);
    return false;
  }
};

const deleteProductFromES = async (productId) => {
  if (!isESConnected()) return false;
  try {
    const esClient = getClient();
    await esClient.delete({ index: 'products', id: productId.toString() });
    return true;
  } catch (err) {
    console.warn('ES deleteProduct failed:', err.message);
    return false;
  }
};

const searchInES = async ({ q, category, minPrice, maxPrice, sort, from, size }) => {
  if (!isESConnected()) return null;
  try {
    const esClient = getClient();
    const mustQueries = [{ term: { isActive: true } }];
    if (q) mustQueries.push({ multi_match: { query: q, fields: ['name^3', 'description', 'tags^2', 'category'] } });
    if (category) mustQueries.push({ term: { category } });
    
    const filterQueries = [];
    if (minPrice || maxPrice) {
      filterQueries.push({ range: { price: { ...(minPrice && { gte: parseFloat(minPrice) }), ...(maxPrice && { lte: parseFloat(maxPrice) }) } } });
    }
    
    const sortOptions = sort === 'price_asc' ? [{ price: 'asc' }] : sort === 'price_desc' ? [{ price: 'desc' }] : sort === 'rating' ? [{ 'ratings.average': 'desc' }] : ['_score'];
    
    const result = await esClient.search({
      index: 'products',
      body: {
        query: { bool: { must: mustQueries, filter: filterQueries } },
        sort: sortOptions,
        from,
        size,
      },
    });
    
    return {
      ids: result.hits.hits.map(h => h._id),
      total: result.hits.total.value || 0,
    };
  } catch (err) {
    console.warn('ES search failed:', err.message);
    return null;
  }
};

module.exports = { indexProduct, updateProductInES, deleteProductFromES, searchInES };
