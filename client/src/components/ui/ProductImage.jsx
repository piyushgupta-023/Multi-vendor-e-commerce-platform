import { useState } from 'react';
import { getProductImageCandidates } from '../../utils/productImages';

const PLACEHOLDER_IMAGE = '/product-placeholder.svg';

export default function ProductImage({ product, imageIndex = 0, alt, className, ...imageProps }) {
  const allImageCandidates = getProductImageCandidates(product);
  const startIndex = Math.min(imageIndex, Math.max(allImageCandidates.length - 1, 0));
  const imageCandidates = [
    ...allImageCandidates.slice(startIndex),
    ...allImageCandidates.slice(0, startIndex),
  ];
  const signature = imageCandidates.join('|');
  const [failedImages, setFailedImages] = useState({ signature: '', urls: [] });
  const failedUrls = failedImages.signature === signature ? failedImages.urls : [];
  const imageUrl = imageCandidates.find((url) => !failedUrls.includes(url)) || PLACEHOLDER_IMAGE;

  return (
    <img
      {...imageProps}
      src={imageUrl}
      alt={alt}
      className={className}
      onError={() => {
        if (imageUrl !== PLACEHOLDER_IMAGE) {
          setFailedImages((previous) => ({
            signature,
            urls: [...(previous.signature === signature ? previous.urls : []), imageUrl],
          }));
        }
      }}
    />
  );
}
