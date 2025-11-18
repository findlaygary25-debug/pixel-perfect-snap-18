import { useEffect } from 'react';

type VideoSchemaProps = {
  videoId: string;
  name: string;
  description: string;
  thumbnailUrl: string;
  uploadDate: string;
  duration?: string;
  contentUrl: string;
  embedUrl: string;
  interactionStatistic: {
    viewCount: number;
    likeCount: number;
    commentCount: number;
  };
  author: {
    name: string;
    url: string;
  };
  genre?: string[];
  keywords?: string[];
  isFamilyFriendly?: boolean;
  inLanguage?: string;
};

export const VideoSchema = ({
  videoId,
  name,
  description,
  thumbnailUrl,
  uploadDate,
  duration,
  contentUrl,
  embedUrl,
  interactionStatistic,
  author,
  genre = ["Entertainment"],
  keywords = [],
  isFamilyFriendly = true,
  inLanguage = "en-US",
}: VideoSchemaProps) => {
  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      "@id": `https://utubchat.com/video/${videoId}`,
      name,
      description,
      thumbnailUrl,
      uploadDate,
      contentUrl,
      embedUrl,
      inLanguage,
      isFamilyFriendly,
      ...(duration && { duration }),
      ...(genre.length > 0 && { genre }),
      ...(keywords.length > 0 && { keywords: keywords.join(", ") }),
      interactionStatistic: [
        {
          "@type": "InteractionCounter",
          "interactionType": "https://schema.org/WatchAction",
          "userInteractionCount": interactionStatistic.viewCount
        },
        {
          "@type": "InteractionCounter",
          "interactionType": "https://schema.org/LikeAction",
          "userInteractionCount": interactionStatistic.likeCount
        },
        {
          "@type": "InteractionCounter",
          "interactionType": "https://schema.org/CommentAction",
          "userInteractionCount": interactionStatistic.commentCount
        }
      ],
      author: {
        "@type": "Person",
        "name": author.name,
        "url": author.url
      },
      publisher: {
        "@type": "Organization",
        "@id": "https://utubchat.com/#organization",
        "name": "uTubChat",
        "logo": {
          "@type": "ImageObject",
          "url": "https://utubchat.com/favicon.png"
        }
      },
      potentialAction: {
        "@type": "WatchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": embedUrl,
          "actionPlatform": [
            "https://schema.org/DesktopWebPlatform",
            "https://schema.org/MobileWebPlatform",
            "https://schema.org/IOSPlatform",
            "https://schema.org/AndroidPlatform"
          ]
        }
      }
    };

    const scriptId = `video-schema-${videoId}`;
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
  }, [videoId, name, description, thumbnailUrl, uploadDate, duration, contentUrl, embedUrl, interactionStatistic, author, genre, keywords, isFamilyFriendly, inLanguage]);

  return null;
};
