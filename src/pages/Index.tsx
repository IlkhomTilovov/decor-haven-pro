import { Link } from 'react-router-dom';
import { ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/ProductCard';
import { useFeaturedProducts, useCategories } from '@/hooks/useProducts';
import { useLanguage } from '@/hooks/useLanguage';
import { useSiteContent } from '@/hooks/useSiteContent';
import { EditableText } from '@/components/EditableText';
import { EditableImage } from '@/components/EditableImage';
import { LazyImage } from '@/components/LazyImage';

export default function Index() {
  const { language, t } = useLanguage();
  const { products: featuredProducts, loading: productsLoading } = useFeaturedProducts(8);
  const { categories, loading: categoriesLoading } = useCategories();
  const { loading: contentLoading } = useSiteContent();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section id="hero" className="relative h-[80vh] min-h-[600px] flex items-center">
        <div className="absolute inset-0 z-0">
          <EditableImage
            contentKey="hero_background_image"
            fallbackSrc="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1920"
            alt="Modern living room"
            className="w-full h-full object-cover"
            wrapperClassName="w-full h-full relative z-10"
            section="hero"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/70 to-transparent pointer-events-none z-20" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-xl">
            {contentLoading ? (
              <div className="space-y-6 animate-pulse">
                <div className="h-12 md:h-16 lg:h-20 w-3/4 bg-muted/60 rounded" />
                <div className="h-6 w-2/3 bg-muted/40 rounded" />
                <div className="flex gap-4">
                  <div className="h-12 w-40 bg-muted/40 rounded-full" />
                  <div className="h-12 w-40 bg-muted/30 rounded-full" />
                </div>
              </div>
            ) : (
              <>
                <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6 animate-fade-in">
                  <EditableText
                    contentKey="hero_title"
                    fallback={t.hero.title}
                    requireDb
                    as="span"
                    className="font-serif text-4xl md:text-5xl lg:text-6xl font-bold"
                  />
                </h1>
                <p className="text-lg text-muted-foreground mb-8 animate-fade-in">
                  <EditableText
                    contentKey="hero_subtitle"
                    fallback={t.hero.subtitle}
                    requireDb
                    as="span"
                    className="text-lg"
                  />
                </p>
                <div className="flex flex-wrap gap-4 animate-fade-in">
                  <Button asChild size="lg" className="rounded-full px-8">
                    <Link to="/catalog">{t.hero.cta}</Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="rounded-full px-8">
                    <Link to="/contact">{t.hero.consultation}</Link>
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-10">
            <h2 className="font-serif text-3xl font-bold">
              <EditableText 
                contentKey="featured_title" 
                fallback={t.products.featured}
                as="span"
                className="font-serif text-3xl font-bold"
              />
            </h2>
            <Button asChild variant="ghost" className="gap-2">
              <Link to="/catalog">{t.products.viewAll} <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </div>
          
          {productsLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-12">
              Hozircha tanlangan mahsulotlar yo'q
            </p>
          )}
        </div>
      </section>

      {/* Categories */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="font-serif text-3xl font-bold text-center mb-10">
            <EditableText 
              contentKey="categories_title" 
              fallback={t.categories.title}
              as="span"
              className="font-serif text-3xl font-bold"
            />
          </h2>
          
          {categoriesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : categories.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {categories.slice(0, 8).map(category => (
                <Link
                  key={category.id}
                  to={`/catalog?category=${category.id}`}
                  className="group relative aspect-square rounded-2xl overflow-hidden"
                >
                  <LazyImage 
                    src={category.image || '/placeholder.svg'} 
                    alt={language === 'uz' ? category.name_uz : category.name_ru} 
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    wrapperClassName="w-full h-full"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white font-medium text-lg">
                      {language === 'uz' ? category.name_uz : category.name_ru}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-12">
              Hozircha kategoriyalar yo'q
            </p>
          )}
        </div>
      </section>
    </div>
  );
}