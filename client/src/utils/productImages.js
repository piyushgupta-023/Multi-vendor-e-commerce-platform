export const getProductImageCandidates = (product = {}) => {
  const productImages = Array.isArray(product.images) ? product.images.filter(Boolean) : [];
  const orderedImages = [
    ...productImages.filter((image) => typeof image === 'object' && image.isPrimary),
    ...productImages.filter((image) => typeof image !== 'object' || !image.isPrimary),
  ];

  return [
    ...orderedImages.map((image) => (typeof image === 'string' ? image : image.url)),
    product.image,
    product.imageUrl,
    product.thumbnail,
  ].filter((url, index, urls) => (
    typeof url === 'string' && url.trim() && urls.indexOf(url) === index
  ));
};
