import heroMobile640 from '@/assets/hero/hero-mobile-640.webp';
import heroMobile960 from '@/assets/hero/hero-mobile-960.webp';
import heroWide960 from '@/assets/hero/hero-wide-960.webp';
import './MenuHero.css';

/**
 * Signature terrace/sunset photograph (approved edit: straightened, cropped).
 * Phones: 3:2 crop. Tablet & desktop: 2:1 crop, max ~960px wide so it stays sharp.
 * No text or logo over the photo (approved).
 */
export default function MenuHero() {
  return (
    <section className="bn-hero" aria-label="Bonsoir terrace">
      <div className="container bn-hero__frame">
        <picture>
          <source media="(min-width: 640px)" srcSet={heroWide960} width={960} height={480} />
          <img
            className="bn-hero__img"
            src={heroMobile960}
            srcSet={`${heroMobile640} 640w, ${heroMobile960} 960w`}
            sizes="100vw"
            width={960}
            height={640}
            alt="Bonsoir’s outdoor terrace at sunset, overlooking the valley lights"
            decoding="async"
          />
        </picture>
      </div>
    </section>
  );
}
