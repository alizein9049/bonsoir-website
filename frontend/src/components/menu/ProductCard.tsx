import type { MenuItem } from '@/types/menu';
import { formatPrice } from '@/utils/formatPrice';
import ProductImage from './ProductImage';
import './ProductCard.css';

export interface ProductCardProps {
  item: MenuItem;
  categorySlug: string;
}

/**
 * Menu item card. Phones: compact row (image left, text right).
 * Tablet/desktop: image-on-top card. Layout switches in CSS only.
 * No order/add buttons (not an ordering site).
 */
export default function ProductCard({ item, categorySlug }: ProductCardProps) {
  const flavors = item.options.filter((o) => o.type === 'flavor');
  const addons = item.options.filter((o) => o.type === 'addon');

  return (
    <article className="bn-card" aria-labelledby={`item-${item.id}-name`}>
      <ProductImage imageUrl={item.imageUrl} name={item.name} categorySlug={categorySlug} className="bn-card__media" />
      <div className="bn-card__body">
        <div className="bn-card__head">
          <h3 id={`item-${item.id}-name`} className="bn-card__name">
            {item.name}
          </h3>
          <p className="bn-card__price">
            <span className="visually-hidden">Price: </span>
            {formatPrice(item.price)}
          </p>
        </div>
        {item.description && <p className="bn-card__desc">{item.description}</p>}
        {flavors.length > 0 && (
          <p className="bn-card__options">
            <span className="bn-card__options-label">Flavors:</span> {flavors.map((o) => o.name).join(', ')}
          </p>
        )}
        {addons.length > 0 && (
          <p className="bn-card__options">
            <span className="bn-card__options-label">Includes:</span> {addons.map((o) => o.name).join(', ')}
          </p>
        )}
      </div>
    </article>
  );
}
