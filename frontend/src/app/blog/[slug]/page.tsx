import type { Metadata } from 'next';
import { serverFetch, SITE_URL } from '@/lib/api';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await serverFetch<any>(`/blog/${slug}`);
  if (!data?.blog) return { title: 'Blog Not Found' };
  const blog = data.blog;
  return {
    title: `${blog.meta_title} — Grand Masala`,
    description: blog.metaDescription,
    keywords: blog.metaKeyWord,
    alternates: { canonical: `${SITE_URL}/blog/${slug}` },
    openGraph: {
      title: blog.meta_title,
      description: blog.metaDescription,
      url: `${SITE_URL}/blog/${slug}`,
      type: 'article',
      images: blog.imageUrl ? [{ url: blog.imageUrl }] : [],
      publishedTime: blog.createdAt,
      modifiedTime: blog.updatedAt,
      authors: [blog.author || 'Grand Masala'],
    },
  };
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await serverFetch<any>(`/blog/${slug}`);
  if (!data?.blog) notFound();
  const blog = data.blog;

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: blog.meta_title,
    description: blog.metaDescription,
    image: blog.imageUrl,
    author: { '@type': 'Person', name: blog.author || 'Grand Masala' },
    publisher: {
      '@type': 'Organization',
      name: 'Grand Masala',
      logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo.png` },
    },
    datePublished: blog.createdAt,
    dateModified: blog.updatedAt,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${SITE_URL}/blog/${slug}` },
  };

  const formattedDate = new Date(blog.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const primaryTag = blog.metaKeyWord?.[0] || 'Spices & Health';

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="blog-detail-root">

        {/* ── Hero ─────────────────────────────────────────────── */}
        <header className="blog-hero">
          {/* Background image + overlays */}
          {blog.imageUrl && (
            <div className="blog-hero__bg">
              <img
                src={blog.imageUrl}
                alt=""
                
                className="blog-hero__img w-full h-full object-cover"
                sizes="100vw"
                priority
              />
              {/* warm dark gradient so text is always readable */}
              <div className="blog-hero__overlay" />
            </div>
          )}
          {!blog.imageUrl && <div className="blog-hero__bg blog-hero__bg--solid" />}

          {/* Decorative spice motif rings */}
          <div className="blog-hero__ring blog-hero__ring--1" aria-hidden />
          <div className="blog-hero__ring blog-hero__ring--2" aria-hidden />

          <div className="blog-hero__content">
            <Link href="/blog" className="blog-hero__back">
              ← All Blogs
            </Link>

            {/* <span className="blog-hero__tag">{primaryTag}</span> */}

            <h1 className="blog-hero__title">{blog.meta_title}</h1>

            <p className="blog-hero__meta">
              By&nbsp;<strong>{blog.author || 'Grand Masala'}</strong>
              &nbsp;&middot;&nbsp;
              {formattedDate}
            </p>
          </div>

          {/* Scallop bottom edge */}
          <div className="blog-hero__scallop" aria-hidden />
        </header>

        {/* ── Article body ─────────────────────────────────────── */}
        <main className="blog-main">
          <article className="blog-article">

            <div
              className="blog-article__body"
              dangerouslySetInnerHTML={{ __html: blog.html_content }}
            />

            {/* {blog.metaKeyWord?.length > 0 && (
              <footer className="blog-tags">
                <span className="blog-tags__label">Topics</span>
                <div className="blog-tags__list">
                  {blog.metaKeyWord.map((kw: string) => (
                    <span key={kw} className="blog-tags__chip">{kw}</span>
                  ))}
                </div>
              </footer>
            )} */}
          </article>

          {/* ── CTA ──────────────────────────────────────────────── */}
          {/* <section className="blog-cta">
            <div className="blog-cta__inner">
              <div className="blog-cta__icon" aria-hidden>🌶</div>
              <h2 className="blog-cta__heading">Ready to taste the difference?</h2>
              <p className="blog-cta__sub">
                Every blend crafted with generations of masala wisdom.
              </p>
              <Link href="/shop" className="blog-cta__btn">
                Shop Grand Masala
                <span className="blog-cta__arrow">→</span>
              </Link>
            </div>
          </section> */}

          {/* ── Back link ─────────────────────────────────────── */}
          {/* <div className="blog-back">
            <Link href="/blog" className="blog-back__link">
              ← Back to all blogs
            </Link>
          </div> */}
        </main>
      </div>

      {/* ── Styles ───────────────────────────────────────────────── */}
      <style>{`
        /* ── Tokens ──────────────────────────────────────── */
        .blog-detail-root {
          --crimson:        #81190B;
          --crimson-dark:   #5a1008;
          --crimson-deep:   #3b0a05;
          --amber:          #D97706;
          --amber-light:    #FDE68A;
          --cream:          #FDFBF7;
          --parchment:      #F5F0E8;
          --ink:            #1C120F;
          --ink-muted:      #5C3D35;
          --border-warm:    rgba(129,25,11,0.15);

          font-family: 'Georgia', 'Times New Roman', serif;
          background: var(--cream);
          color: var(--ink);
          min-height: 100vh;
        }

        /* ── Hero ──────────────────────────────────────────── */
        .blog-hero {
          position: relative;
          min-height: 72vh;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          overflow: hidden;
        }

        .blog-hero__bg {
          position: absolute;
          inset: 0;
          z-index: 0;
        }
        .blog-hero__bg--solid {
          background: var(--crimson-deep);
        }
        .blog-hero__img {
          object-fit: cover;
          object-position: center;
        }
        .blog-hero__overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom,
            rgba(30, 6, 2, 0.35) 0%,
            rgba(30, 6, 2, 0.72) 60%,
            rgba(20, 4, 1, 0.92) 100%
          );
        }

        /* Decorative concentric rings */
        .blog-hero__ring {
          position: absolute;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.06);
          z-index: 1;
          pointer-events: none;
        }
        .blog-hero__ring--1 {
          width: 520px; height: 520px;
          top: -160px; right: -120px;
        }
        .blog-hero__ring--2 {
          width: 320px; height: 320px;
          top: -80px; right: -40px;
        }

        .blog-hero__content {
          position: relative;
          z-index: 2;
          max-width: 860px;
          margin: 0 auto;
          padding: 2rem 1.5rem 4rem;
          width: 100%;
        }

        .blog-hero__back {
          display: inline-block;
          font-family: 'Helvetica Neue', Arial, sans-serif;
          font-size: 0.78rem;
          letter-spacing: 0.06em;
          color: rgba(255,255,255,0.55);
          text-decoration: none;
          margin-bottom: 2rem;
          transition: color 0.2s;
        }
        .blog-hero__back:hover { color: rgba(255,255,255,0.9); }

        .blog-hero__tag {
          display: inline-block;
          font-family: 'Helvetica Neue', Arial, sans-serif;
          font-size: 0.7rem;
          font-weight: 600;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--amber-light);
          border: 1px solid rgba(253,230,138,0.3);
          padding: 0.3rem 0.8rem;
          border-radius: 2rem;
          margin-bottom: 1.25rem;
        }

        .blog-hero__title {
          font-size: clamp(2rem, 5vw, 3.5rem);
          font-weight: 700;
          line-height: 1.18;
          color: #fff;
          margin: 0 0 1.25rem;
          letter-spacing: -0.01em;
          max-width: 780px;
        }

        .blog-hero__meta {
          font-family: 'Helvetica Neue', Arial, sans-serif;
          font-size: 0.875rem;
          color: rgba(255,255,255,0.55);
          margin: 0;
        }
        .blog-hero__meta strong {
          color: rgba(255,255,255,0.8);
          font-weight: 500;
        }

        /* Scallop wave divider */
        .blog-hero__scallop {
          position: relative;
          z-index: 3;
          height: 40px;
          background: var(--cream);
          clip-path: ellipse(55% 100% at 50% 100%);
          margin-top: -2px;
        }

        /* ── Main layout ────────────────────────────────────── */
        .blog-main {
          max-width: 780px;
          margin: 0 auto;
          padding: 0 1.5rem 6rem;
        }

        /* ── Article prose ──────────────────────────────────── */
        .blog-article {
          padding-top: 3rem;
        }

        .blog-article__body {
          font-size: 1.08rem;
          line-height: 1.85;
          color: var(--ink);
        }

        /* First paragraph drop-cap */
        .blog-article__body > p:first-of-type::first-letter {
          float: left;
          font-size: 4.2rem;
          line-height: 0.8;
          padding-right: 0.12em;
          margin-top: 0.08em;
          font-weight: 700;
          color: var(--crimson);
          font-family: Georgia, serif;
        }

        /* Headings inside blog content */
        .blog-article__body h1,
        .blog-article__body h2,
        .blog-article__body h3 {
          color: var(--crimson);
          margin-top: 2.5rem;
          margin-bottom: 0.75rem;
          line-height: 1.3;
        }
        .blog-article__body h2 { font-size: 1.6rem; }
        .blog-article__body h3 { font-size: 1.25rem; }

        /* Horizontal rules styled as spice dividers */
        .blog-article__body hr {
          border: none;
          text-align: center;
          margin: 2.5rem 0;
          color: var(--amber);
          letter-spacing: 0.4em;
        }
        .blog-article__body hr::after {
          content: '✦  ✦  ✦';
          font-size: 0.75rem;
          color: var(--amber);
        }

        /* Blockquotes */
        .blog-article__body blockquote {
          border-left: 3px solid var(--crimson);
          margin: 2rem 0;
          padding: 0.75rem 0 0.75rem 1.5rem;
          font-style: italic;
          font-size: 1.15rem;
          color: var(--ink-muted);
          background: var(--parchment);
          border-radius: 0 8px 8px 0;
        }

        .blog-article__body a {
          color: var(--crimson);
          text-underline-offset: 3px;
        }
        .blog-article__body a:hover { color: var(--crimson-dark); }

        /* ── Tags ───────────────────────────────────────────── */
        .blog-tags {
          margin-top: 3.5rem;
          padding-top: 2rem;
          border-top: 1px solid var(--border-warm);
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 0.6rem;
        }

        .blog-tags__label {
          font-family: 'Helvetica Neue', Arial, sans-serif;
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--ink-muted);
          margin-right: 0.4rem;
        }

        .blog-tags__list {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
        }

        .blog-tags__chip {
          font-family: 'Helvetica Neue', Arial, sans-serif;
          font-size: 0.75rem;
          font-weight: 500;
          color: var(--crimson);
          background: rgba(129,25,11,0.07);
          border: 1px solid rgba(129,25,11,0.18);
          padding: 0.28rem 0.75rem;
          border-radius: 2rem;
          letter-spacing: 0.02em;
        }

        /* ── CTA Banner ─────────────────────────────────────── */
        .blog-cta {
          margin-top: 4rem;
          border-radius: 16px;
          background: var(--crimson);
          overflow: hidden;
          position: relative;
        }

        /* subtle warm texture via repeating gradient */
        .blog-cta::before {
          content: '';
          position: absolute;
          inset: 0;
          background: repeating-linear-gradient(
            -45deg,
            rgba(255,255,255,0.03) 0px,
            rgba(255,255,255,0.03) 1px,
            transparent 1px,
            transparent 12px
          );
        }

        .blog-cta__inner {
          position: relative;
          z-index: 1;
          text-align: center;
          padding: 3rem 2rem;
        }

        .blog-cta__icon {
          font-size: 2.2rem;
          margin-bottom: 1rem;
          display: block;
          filter: drop-shadow(0 2px 6px rgba(0,0,0,0.3));
        }

        .blog-cta__heading {
          font-size: 1.75rem;
          font-weight: 700;
          color: #fff;
          margin: 0 0 0.6rem;
          line-height: 1.25;
        }

        .blog-cta__sub {
          font-family: 'Helvetica Neue', Arial, sans-serif;
          font-size: 0.925rem;
          color: rgba(255,255,255,0.65);
          margin: 0 0 1.75rem;
        }

        .blog-cta__btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: #fff;
          color: var(--crimson);
          font-family: 'Helvetica Neue', Arial, sans-serif;
          font-size: 0.9rem;
          font-weight: 700;
          letter-spacing: 0.03em;
          padding: 0.75rem 2rem;
          border-radius: 2rem;
          text-decoration: none;
          transition: background 0.2s, transform 0.15s;
        }
        .blog-cta__btn:hover {
          background: var(--amber-light);
          transform: translateY(-1px);
        }

        .blog-cta__arrow {
          font-size: 1rem;
          transition: transform 0.2s;
        }
        .blog-cta__btn:hover .blog-cta__arrow { transform: translateX(3px); }

        /* ── Back link ──────────────────────────────────────── */
        .blog-back {
          margin-top: 2.5rem;
          text-align: center;
        }
        .blog-back__link {
          font-family: 'Helvetica Neue', Arial, sans-serif;
          font-size: 0.85rem;
          color: var(--ink-muted);
          text-decoration: none;
          letter-spacing: 0.02em;
          transition: color 0.2s;
        }
        .blog-back__link:hover { color: var(--crimson); }

        /* ── Responsive ─────────────────────────────────────── */
        @media (max-width: 640px) {
          .blog-hero { min-height: 60vh; }
          .blog-hero__title { font-size: 1.8rem; }
          .blog-article__body > p:first-of-type::first-letter {
            font-size: 3.2rem;
          }
          .blog-cta__heading { font-size: 1.4rem; }
        }
      `}</style>
    </>
  );
}