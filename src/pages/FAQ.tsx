import { useEffect } from "react";
import { BreadcrumbSchema } from "@/components/BreadcrumbSchema";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const faqData = [
  {
    question: "What is Voice2Fire?",
    answer: "Voice2Fire is a dynamic social platform where creators can share videos, connect with audiences, and earn through our innovative affiliate marketing program. It's designed to help you turn your passion and voice into profit while building a vibrant community."
  },
  {
    question: "How does the affiliate program work?",
    answer: "Our affiliate program allows you to earn commissions by referring new users and advertisers to Voice2Fire. When someone signs up using your affiliate link, you earn a percentage of their transactions. We offer multi-level commissions, meaning you can also earn from referrals made by your direct referrals."
  },
  {
    question: "How do I upload videos on Voice2Fire?",
    answer: "To upload videos, simply click on the 'Upload' button in the navigation menu. You can upload video files, add captions, and publish them to your profile. Make sure your videos meet our content guidelines and are in supported formats (MP4, MOV, AVI). You need to be logged in to upload videos."
  },
  {
    question: "Can I earn money by uploading videos?",
    answer: "Yes! You can earn money through multiple ways: promoting your products in the integrated store, getting referral commissions through the affiliate program, and receiving direct support from your audience through our wallet system. The more engaging your content, the more opportunities you have to monetize."
  },
  {
    question: "How does the store feature work?",
    answer: "The Store feature allows you to create your own online shop directly on Voice2Fire. You can list products, manage inventory, process orders, and track sales all in one place. It's perfect for creators who want to sell merchandise, digital products, or services to their followers."
  },
  {
    question: "What is the Wallet feature?",
    answer: "The Wallet is your personal financial hub on Voice2Fire. It tracks your earnings from affiliate commissions, store sales, and other monetization activities. You can view your balance, transaction history, and request withdrawals once you reach the minimum payout threshold."
  },
  {
    question: "How do I grow my audience on Voice2Fire?",
    answer: "Growing your audience requires consistent, high-quality content. Post regularly, engage with your followers through comments, use relevant hashtags, and collaborate with other creators. Participate in trending topics, share your videos on other social media platforms, and leverage the affiliate program to build your network."
  },
  {
    question: "Is Voice2Fire free to use?",
    answer: "Yes, Voice2Fire is completely free to join and use. You can create an account, upload videos, and start building your audience without any upfront costs. We only take a small commission on transactions made through the platform's store and affiliate features."
  },
  {
    question: "What video formats are supported?",
    answer: "Voice2Fire supports common video formats including MP4, MOV, and AVI. We recommend using MP4 format with H.264 codec for best compatibility. Videos should be under 500MB in size, and we support various aspect ratios including 16:9 (landscape), 9:16 (vertical), and 1:1 (square)."
  },
  {
    question: "How do I track my analytics?",
    answer: "Navigate to the Analytics page from the main menu to view detailed insights about your content performance. You can see metrics like views, likes, engagement rates, follower growth, and earnings. Analytics help you understand what content resonates with your audience and optimize your strategy."
  },
  {
    question: "Can I edit or delete my videos after posting?",
    answer: "Yes, you have full control over your content. You can edit video captions, add or remove chapters, and delete videos from your profile at any time. Simply go to your profile, find the video you want to modify, and use the edit or delete options."
  },
  {
    question: "How do I report inappropriate content?",
    answer: "If you encounter content that violates our community guidelines, click the share button on any video and select 'Report'. Our moderation team reviews all reports within 24 hours and takes appropriate action. We're committed to maintaining a safe and positive environment for all users."
  }
];

export default function FAQ() {
  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqData.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    };

    const scriptId = 'faq-schema';
    let scriptElement = document.getElementById(scriptId) as HTMLScriptElement;

    if (!scriptElement) {
      scriptElement = document.createElement('script') as HTMLScriptElement;
      scriptElement.id = scriptId;
      scriptElement.type = 'application/ld+json';
      document.head.appendChild(scriptElement);
    }

    scriptElement.textContent = JSON.stringify(schema);

    return () => {
      const element = document.getElementById(scriptId);
      if (element) {
        element.remove();
      }
    };
  }, []);

  return (
    <div className="container max-w-4xl py-8">
      <BreadcrumbSchema 
        items={[
          { name: "Home", url: "https://voice2fire.com/" },
          { name: "FAQ", url: "https://voice2fire.com/faq" }
        ]}
      />
      
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">Frequently Asked Questions</CardTitle>
          <CardDescription>
            Find answers to common questions about Voice2Fire platform features, affiliate program, and video uploading
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {faqData.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      <div className="mt-8 text-center">
        <p className="text-muted-foreground mb-4">
          Still have questions? We're here to help!
        </p>
        <a 
          href="/contact" 
          className="text-primary hover:underline font-medium"
        >
          Contact Support →
        </a>
      </div>
    </div>
  );
}
