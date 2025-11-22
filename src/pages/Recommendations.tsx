import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

interface Tool {
  name: string;
  description: string;
  category: string;
  url?: string;
  tags: string[];
  recommended?: boolean;
}

const toolsByLetter: Record<string, Tool[]> = {
  A: [
    {
      name: "AI Tools",
      description: "Artificial Intelligence platforms for content generation, automation, and intelligent features.",
      category: "Technology",
      tags: ["AI", "Automation", "Machine Learning"],
    },
    {
      name: "Analytics",
      description: "Track your app performance, user behavior, and gain insights to improve your platform.",
      category: "Business",
      tags: ["Analytics", "Metrics", "Insights"],
    },
  ],
  C: [
    {
      name: "Cloud Services",
      description: "Backend infrastructure and cloud computing platforms for scalable applications.",
      category: "Infrastructure",
      tags: ["Cloud", "Backend", "Hosting"],
    },
  ],
  D: [
    {
      name: "Database Management",
      description: "Tools for managing, querying, and optimizing your application databases.",
      category: "Development",
      tags: ["Database", "SQL", "Storage"],
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
    },
  ],
  N: [
    {
      name: "Notification Systems",
      description: "Multi-channel notification delivery systems for email, SMS, and in-app alerts.",
      category: "Communication",
      tags: ["Notifications", "Email", "SMS"],
    },
  ],
  P: [
    {
      name: "Payment Processing",
      description: "Secure payment gateways and transaction processing for e-commerce applications.",
      category: "Finance",
      tags: ["Payments", "Stripe", "E-commerce"],
    },
  ],
  R: [
    {
      name: "Real-time Features",
      description: "Enable live updates, chat, and collaborative features in your applications.",
      category: "Technology",
      tags: ["Real-time", "WebSockets", "Live Updates"],
    },
  ],
  S: [
    {
      name: "Storage Solutions",
      description: "File storage and content delivery networks for media-rich applications.",
      category: "Infrastructure",
      tags: ["Storage", "CDN", "Media"],
    },
  ],
  V: [
    {
      name: "Video Platforms",
      description: "Video hosting, streaming, and processing services for content creators.",
      category: "Media",
      tags: ["Video", "Streaming", "Content"],
    },
  ],
  W: [
    {
      name: "Web Development",
      description: "Modern frameworks and tools for building responsive, fast web applications.",
      category: "Development",
      tags: ["Web", "React", "Frontend"],
    },
  ],
};

export default function Recommendations() {
  const [activeLetter, setActiveLetter] = useState("L");

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
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
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
                      <div className="flex flex-wrap gap-2">
                        {tool.tags.map((tag) => (
                          <Badge key={tag} variant="secondary">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      {tool.recommended && (
                        <div className="mt-4 p-3 bg-primary/10 rounded-lg">
                          <p className="text-sm font-medium text-primary">
                            ⭐ Highly Recommended by Voice2Fire
                          </p>
                        </div>
                      )}
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
    </div>
  );
}
