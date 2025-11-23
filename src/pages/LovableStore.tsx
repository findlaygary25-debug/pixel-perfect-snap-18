import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ExternalLink, ShoppingCart } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface LovableProduct {
  name: string;
  description: string;
  price: number;
  priceInCoins?: number;
  category: string;
  image: string;
  externalUrl?: string;
  tags: string[];
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const productsByLetter: Record<string, LovableProduct[]> = {
  A: [
    {
      name: "AI Assistant Pro",
      description: "Advanced AI-powered development assistant for faster coding",
      price: 29.99,
      priceInCoins: 1500,
      category: "Tools",
      image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&q=80",
      tags: ["AI", "Development", "Productivity"]
    }
  ],
  D: [
    {
      name: "Design System Bundle",
      description: "Complete UI/UX design system with components and templates",
      price: 49.99,
      priceInCoins: 2500,
      category: "Design",
      image: "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=400&q=80",
      tags: ["Design", "UI/UX", "Templates"]
    }
  ],
  L: [
    {
      name: "Lovable Pro Subscription",
      description: "Premium subscription with unlimited AI credits and advanced features",
      price: 99.99,
      category: "Subscription",
      image: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&q=80",
      externalUrl: "https://lovable.dev/pricing?via=vf555-88",
      tags: ["Subscription", "Premium", "Pro"]
    },
    {
      name: "Lovable Starter Pack",
      description: "Get started with Lovable development tools and resources",
      price: 19.99,
      priceInCoins: 1000,
      category: "Bundle",
      image: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&q=80",
      tags: ["Starter", "Bundle", "Tools"]
    }
  ],
  P: [
    {
      name: "Premium Templates",
      description: "Collection of professional website templates built with Lovable",
      price: 39.99,
      priceInCoins: 2000,
      category: "Templates",
      image: "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=400&q=80",
      tags: ["Templates", "Premium", "Websites"]
    }
  ],
  T: [
    {
      name: "Training Course Bundle",
      description: "Complete video training courses for mastering Lovable",
      price: 79.99,
      priceInCoins: 4000,
      category: "Education",
      image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=80",
      tags: ["Education", "Training", "Courses"]
    }
  ]
};

export default function LovableStore() {
  const [activeLetter, setActiveLetter] = useState("L");

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Lovable Products Store</h1>
        <p className="text-muted-foreground">
          Browse our curated selection of Lovable products, tools, and resources
        </p>
      </div>

      <Tabs value={activeLetter} onValueChange={setActiveLetter} className="w-full">
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Browse A to Z</h2>
          <TabsList className="w-full justify-start flex-wrap h-auto gap-1 bg-muted/50 p-2">
            {ALPHABET.map((letter) => {
              const hasProducts = productsByLetter[letter]?.length > 0;
              return (
                <TabsTrigger
                  key={letter}
                  value={letter}
                  disabled={!hasProducts}
                  className="min-w-[40px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  {letter}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {ALPHABET.map((letter) => (
          <TabsContent key={letter} value={letter} className="mt-6">
            {productsByLetter[letter]?.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {productsByLetter[letter].map((product, index) => (
                  <Card key={index} className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="aspect-video overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                    </div>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-xl">{product.name}</CardTitle>
                        <Badge variant="secondary">{product.category}</Badge>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {product.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          {product.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              #{tag}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-bold">${product.price}</span>
                            {product.priceInCoins && (
                              <span className="text-sm text-muted-foreground">
                                or {product.priceInCoins} coins
                              </span>
                            )}
                          </div>
                          
                          <div className="flex gap-2">
                            {product.externalUrl ? (
                              <Button asChild className="flex-1">
                                <a href={product.externalUrl} target="_blank" rel="noopener noreferrer">
                                  Buy Now
                                  <ExternalLink className="ml-2 h-4 w-4" />
                                </a>
                              </Button>
                            ) : (
                              <>
                                {product.priceInCoins && (
                                  <Button variant="outline" className="flex-1">
                                    <ShoppingCart className="mr-2 h-4 w-4" />
                                    Buy with Coins
                                  </Button>
                                )}
                                <Button className="flex-1">
                                  <ShoppingCart className="mr-2 h-4 w-4" />
                                  Buy Now
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No products found starting with "{letter}"
                </p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
