import type { MenuItem } from '@/types/menu';
import { formatPrice } from '@/utils/formatPrice';
import ProductImage from './ProductImage';
import './FeaturedRow.css';

export interface FeaturedRowProps {
  items: Array<{ item: MenuItem; categorySlug: string }>;
}

/**
 * Manually featured items (chosen in the Admin Dashboard), in their normal display order.
 * Hidden entirely when nothing is featured.
 */
export default function FeaturedRow({ items }: FeaturedRowProps) {
  if (items.length === 0) return null;

  return (
    <section className="bn-featured" aria-labelledby="featured-heading">
      <div className="container">
        <h2 id="featured-heading" className="bn-section-title">Featured</h2>
      </div>
      <ul className="bn-featured__list container" role="list">
        {items.map(({ item, categorySlug }) => (
          <li key={item.id} className="bn-featured__item">
            <article className="bn-featured__card" aria-labelledby={`featured-${item.id}-name`}>
              <ProductImage imageUrl={item.imageUrl} name={item.name} categorySlug={categorySlug} className="bn-featured__media" />
              <div className="bn-featured__body">
                <h3 id={`featured-${item.id}-name`} className="bn-featured__name">{item.name}</h3>
                {item.description && <p className="bn-featured__desc">{item.description}</p>}
                <p className="bn-featured__price">
                  <span className="visually-hidden">Price: </span>
                  {formatPrice(item.price)}
                </p>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
