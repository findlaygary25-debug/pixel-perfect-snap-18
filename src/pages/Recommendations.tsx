import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Heart, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import PromoteRecommendationDialog from "@/components/PromoteRecommendationDialog";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

interface Tool {
  name: string;
  description: string;
  category: string;
  url?: string;
  tags: string[];
  recommended?: boolean;
  imageUrl?: string;
  imageAlt?: string;
}

const toolsByLetter: Record<string, Tool[]> = {
  A: [
    {
      name: "AI Tools",
      description: "Artificial Intelligence platforms for content generation, automation, and intelligent features.",
      category: "Technology",
      tags: ["AI", "Automation", "Machine Learning"],
      imageUrl: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=100&h=100&fit=crop",
      imageAlt: "#AI #ArtificialIntelligence #MachineLearning #Automation #Voice2Fire #AITools #TechInnovation",
    },
    {
      name: "Analytics",
      description: "Track your app performance, user behavior, and gain insights to improve your platform.",
      category: "Business",
      tags: ["Analytics", "Metrics", "Insights"],
      imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=100&h=100&fit=crop",
      imageAlt: "#Analytics #DataAnalytics #Metrics #BusinessIntelligence #Voice2Fire #DataScience #Insights",
    },
  ],
  C: [
    {
      name: "Cloud Services",
      description: "Backend infrastructure and cloud computing platforms for scalable applications.",
      category: "Infrastructure",
      tags: ["Cloud", "Backend", "Hosting"],
      imageUrl: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=100&h=100&fit=crop",
      imageAlt: "#Cloud #CloudComputing #Backend #Infrastructure #Voice2Fire #Hosting #Scalability",
    },
  ],
  D: [
    {
      name: "Database Management",
      description: "Tools for managing, querying, and optimizing your application databases.",
      category: "Development",
      tags: ["Database", "SQL", "Storage"],
      imageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=100&h=100&fit=crop",
      imageAlt: "#Database #SQL #DataManagement #Storage #Voice2Fire #DatabaseAdmin #DataStorage",
    },
  ],
  L: [
    {
      name: "Lovable",
      description: "The AI-powered full-stack development platform that lets you build production-ready web applications through conversation. Create beautiful UIs, manage databases, add authentication, and deploy—all without writing code manually.",
      category: "Development Platform",
      url: "https://lovable.dev",
      tags: ["AI", "No-Code", "Full-Stack", "Development"],
      recommended: true,
      imageUrl: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=100&h=100&fit=crop",
      imageAlt: "#Lovable #AI #NoCode #FullStack #WebDevelopment #DevTools #BuildFaster #Voice2Fire",
    },
  ],
  N: [
    {
      name: "Notification Systems",
      description: "Multi-channel notification delivery systems for email, SMS, and in-app alerts.",
      category: "Communication",
      tags: ["Notifications", "Email", "SMS"],
      imageUrl: "https://images.unsplash.com/photo-1526628953301-3e589a6a8b74?w=100&h=100&fit=crop",
      imageAlt: "#Notifications #Email #SMS #Communication #Voice2Fire #Alerts #Messaging",
    },
  ],
  P: [
    {
      name: "Payment Processing",
      description: "Secure payment gateways and transaction processing for e-commerce applications.",
      category: "Finance",
      tags: ["Payments", "Stripe", "E-commerce"],
      imageUrl: "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=100&h=100&fit=crop",
      imageAlt: "#Payments #Stripe #PaymentProcessing #Ecommerce #Voice2Fire #FinTech #Transactions",
    },
  ],
  R: [
    {
      name: "Real-time Features",
      description: "Enable live updates, chat, and collaborative features in your applications.",
      category: "Technology",
      tags: ["Real-time", "WebSockets", "Live Updates"],
      imageUrl: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=100&h=100&fit=crop",
      imageAlt: "#Realtime #WebSockets #LiveUpdates #Collaboration #Voice2Fire #InstantMessaging #Chat",
    },
  ],
  S: [
    {
      name: "Storage Solutions",
      description: "File storage and content delivery networks for media-rich applications.",
      category: "Infrastructure",
      tags: ["Storage", "CDN", "Media"],
      imageUrl: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=100&h=100&fit=crop",
      imageAlt: "#Storage #CDN #MediaStorage #FileStorage #Voice2Fire #ContentDelivery #CloudStorage",
    },
  ],
  V: [
    {
      name: "Video Platforms",
      description: "Video hosting, streaming, and processing services for content creators.",
      category: "Media",
      tags: ["Video", "Streaming", "Content"],
      imageUrl: "https://images.unsplash.com/photo-1492619375914-88005aa9e8fb?w=100&h=100&fit=crop",
      imageAlt: "#Video #Streaming #VideoHosting #ContentCreators #Voice2Fire #LiveStreaming #VideoProduction",
    },
  ],
  W: [
    {
      name: "Web Development",
      description: "Modern frameworks and tools for building responsive, fast web applications.",
      category: "Development",
      tags: ["Web", "React", "Frontend"],
      imageUrl: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=100&h=100&fit=crop",
      imageAlt: "#WebDevelopment #React #Frontend #WebDesign #Voice2Fire #Coding #WebApps",
    },
  ],
};

export default function Recommendations() {
  const [activeLetter, setActiveLetter] = useState("L");
  const [promoteDialog, setPromoteDialog] = useState<{ open: boolean; toolName: string; toolCategory: string }>({
    open: false,
    toolName: "",
    toolCategory: "",
  });

  const hasContent = (letter: string) => {
    return toolsByLetter[letter] && toolsByLetter[letter].length > 0;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Recommendations A-Z</h1>
        <p className="text-muted-foreground">
          Discover tools, platforms, and services organized alphabetically to help you build amazing applications.
        </p>
      </div>

      <Tabs value={activeLetter} onValueChange={setActiveLetter} className="w-full">
        <TabsList className="w-full flex flex-wrap h-auto p-1 gap-1">
          {ALPHABET.map((letter) => (
            <TabsTrigger
              key={letter}
              value={letter}
              disabled={!hasContent(letter)}
              className="flex-1 min-w-[40px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {letter}
            </TabsTrigger>
          ))}
        </TabsList>

        {ALPHABET.map((letter) => (
          <TabsContent key={letter} value={letter} className="mt-6">
            {hasContent(letter) ? (
              <div className="grid gap-6 md:grid-cols-2">
                {toolsByLetter[letter].map((tool, index) => (
                  <Card key={index} className={tool.recommended ? "border-primary shadow-lg" : ""}>
                    <CardHeader>
                      <div className="flex items-start justify-between gap-4">
                        {tool.imageUrl ? (
                          <img 
                            src={tool.imageUrl} 
                            alt={tool.imageAlt || `${tool.name} #Voice2Fire #${tool.tags.map(t => t.replace(/\s+/g, '')).join(' #')}`}
                            className="w-16 h-16 object-cover rounded-lg flex-shrink-0 bg-primary/10"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const iconContainer = e.currentTarget.nextElementSibling as HTMLElement;
                              if (iconContainer) iconContainer.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 hidden">
                          <Sparkles className="w-8 h-8 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="flex items-center gap-2">
                            {tool.name}
                            {tool.recommended && (
                              <Heart className="w-5 h-5 fill-primary text-primary" />
                            )}
                          </CardTitle>
                          <CardDescription className="mt-1">{tool.category}</CardDescription>
                        </div>
                        {tool.url && (
                          <Button
                            size="sm"
                            variant="ghost"
                            asChild
                            className="flex-shrink-0"
                          >
                            <a href={tool.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{tool.description}</p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {tool.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                      {tool.recommended && (
                        <div className="mb-4 p-3 bg-primary/10 rounded-lg">
                          <p className="text-sm font-medium text-primary">
                            ⭐ Highly Recommended by Voice2Fire
                          </p>
                        </div>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() =>
                          setPromoteDialog({
                            open: true,
                            toolName: tool.name,
                            toolCategory: tool.category,
                          })
                        }
                      >
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Promote This
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No recommendations available for letter "{letter}" yet.</p>
                <p className="text-sm mt-2">Check back soon for more tools and resources!</p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <div className="mt-12 p-6 bg-muted rounded-lg">
        <h2 className="text-2xl font-bold mb-4">About Lovable</h2>
        <p className="text-muted-foreground mb-4">
          Lovable is an AI-powered development platform that revolutionizes how applications are built. 
          With Lovable, you can create full-stack web applications through natural conversation, 
          eliminating the need for manual coding while maintaining professional quality and best practices.
        </p>
        <div className="grid md:grid-cols-3 gap-4 mt-6">
          <div className="p-4 bg-background rounded-lg">
            <h3 className="font-semibold mb-2">🚀 Fast Development</h3>
            <p className="text-sm text-muted-foreground">Build production-ready apps in minutes, not months.</p>
          </div>
          <div className="p-4 bg-background rounded-lg">
            <h3 className="font-semibold mb-2">🎨 Beautiful Design</h3>
            <p className="text-sm text-muted-foreground">Automatic responsive design with modern UI components.</p>
          </div>
          <div className="p-4 bg-background rounded-lg">
            <h3 className="font-semibold mb-2">☁️ Full-Stack Power</h3>
            <p className="text-sm text-muted-foreground">Database, auth, storage, and serverless functions included.</p>
          </div>
        </div>
        <div className="mt-6">
          <p className="text-sm text-muted-foreground mb-2">
            Note: Lovable does not currently have an official affiliate program. However, we highly recommend 
            it based on our experience building Voice2Fire with this amazing platform.
          </p>
        </div>
      </div>

      <PromoteRecommendationDialog
        open={promoteDialog.open}
        onOpenChange={(open) => setPromoteDialog({ ...promoteDialog, open })}
        toolName={promoteDialog.toolName}
        toolCategory={promoteDialog.toolCategory}
      />
    </div>
  );
}
