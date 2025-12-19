'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/widgets/header';
import { CategoryList, useCategories } from '@/entities/category';
import { ProductGrid, useFeaturedProducts, useSaleProducts } from '@/entities/product';
import { Skeleton } from '@/shared/ui';
import styles from './page.module.css';

// Banner component
function Banner() {
  return (
    <div className={styles.banner}>
      <Image
        src="https://picsum.photos/seed/banner/800/400"
        alt="Banner"
        fill
        className={styles.bannerImage}
        priority
      />
      <div className={styles.bannerContent}>
        <h2>Summer Sale</h2>
        <p>Up to 50% off on selected items</p>
        <Link href="/category/fashion" className={styles.bannerBtn}>
          Shop Now
        </Link>
      </div>
    </div>
  );
}

// Categories section
function CategoriesSection() {
  const { data, isLoading } = useCategories();

  if (isLoading) {
    return (
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Categories</h2>
        </div>
        <div className={styles.skeletonCategories}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.skeletonCategory}>
              <Skeleton width={64} height={64} borderRadius="50%" />
              <Skeleton width={50} height={12} borderRadius={4} />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!data?.categories.length) return null;

  return (
    <section className="section">
      <div className="section-header">
        <h2 className="section-title">Categories</h2>
        <Link href="/categories" className="section-link">See All</Link>
      </div>
      <CategoryList categories={data.categories} />
    </section>
  );
}

// Featured products section
function FeaturedSection() {
  const { data, isLoading } = useFeaturedProducts();

  if (isLoading) {
    return (
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">Featured</h2>
        </div>
        <div className={styles.skeletonGrid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={styles.skeletonProduct}>
              <Skeleton height={150} borderRadius={12} />
              <Skeleton width="80%" height={14} borderRadius={4} />
              <Skeleton width="40%" height={16} borderRadius={4} />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!data?.products.length) return null;

  return (
    <section className="section">
      <div className="section-header">
        <h2 className="section-title">Featured</h2>
        <Link href="/products?filter=featured" className="section-link">See All</Link>
      </div>
      <ProductGrid products={data.products} />
    </section>
  );
}

// Sale products section
function SaleSection() {
  const { data, isLoading } = useSaleProducts();

  if (isLoading) {
    return (
      <section className="section">
        <div className="section-header">
          <h2 className="section-title">On Sale</h2>
        </div>
        <div className={styles.skeletonGrid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={styles.skeletonProduct}>
              <Skeleton height={150} borderRadius={12} />
              <Skeleton width="80%" height={14} borderRadius={4} />
              <Skeleton width="40%" height={16} borderRadius={4} />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (!data?.products.length) return null;

  return (
    <section className="section">
      <div className="section-header">
        <h2 className="section-title">On Sale</h2>
        <Link href="/products?filter=sale" className="section-link">See All</Link>
      </div>
      <ProductGrid products={data.products} />
    </section>
  );
}

export default function HomePage() {
  return (
    <main>
      <Header title="Shop" />
      <Banner />
      <CategoriesSection />
      <FeaturedSection />
      <SaleSection />
    </main>
  );
}
