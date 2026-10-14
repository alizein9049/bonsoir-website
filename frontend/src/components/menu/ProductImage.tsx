import ProductPlaceholder from './ProductPlaceholder';

export interface ProductImageProps {
  imageUrl: string | null;
  name: string;
  categorySlug: string;
  className?: string;
}

/**
 * Product photo when one has been uploaded, otherwise the category placeholder.
 * Photos are cropped to the frame (object-fit: cover) so any upload size keeps the grid even.
 */
export default function ProductImage({ imageUrl, name, categorySlug, className = '' }: ProductImageProps) {
  return (
    <div className={`bn-product-image ${className}`.trim()}>
      {imageUrl ? (
        <img src={imageUrl} alt={name} loading="lazy" decoding="async" />
      ) : (
        <ProductPlaceholder categorySlug={categorySlug} />
      )}
    </div>
  );
}
