import { useEffect } from 'react';

type PersonSchemaProps = {
  userId: string;
  name: string;
  image?: string;
  description?: string;
  email?: string;
  url: string;
  followers: number;
  following: number;
  numberOfVideos: number;
};

export const PersonSchema = ({
  userId,
  name,
  image,
  description,
  email,
  url,
  followers,
  following,
  numberOfVideos,
}: PersonSchemaProps) => {
  useEffect(() => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "Person",
      "@id": `https://voice2fire.com/profile/${userId}`,
      "name": name,
      ...(image && { "image": image }),
      ...(description && { "description": description }),
      ...(email && { "email": email }),
      "url": url,
      "identifier": userId,
      "interactionStatistic": [
        {
          "@type": "InteractionCounter",
          "interactionType": "https://schema.org/FollowAction",
          "userInteractionCount": followers
        },
        {
          "@type": "InteractionCounter",
          "interactionType": "https://schema.org/SubscribeAction",
          "userInteractionCount": following
        }
      ],
      "mainEntityOfPage": {
        "@type": "ProfilePage",
        "@id": url,
        "about": {
          "@type": "Person",
          "name": name
        }
      },
      "sameAs": [url],
      "knowsAbout": ["Video Creation", "Content Creation", "Social Media"],
      "agentInteractionStatistic": {
        "@type": "InteractionCounter",
        "interactionType": "https://schema.org/CreateAction",
        "userInteractionCount": numberOfVideos
      }
    };

    const scriptId = 'person-schema';
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
  }, [userId, name, image, description, email, url, followers, following, numberOfVideos]);

  return null;
};
