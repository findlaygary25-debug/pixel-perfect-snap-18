import { useEffect } from 'react';

type OpenGraphTagsProps = {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  videoUrl: string;
  author: {
    name: string;
    url: string;
  };
  views?: number;
  likes?: number;
};

export const OpenGraphTags = ({
  videoId,
  title,
  description,
  thumbnailUrl,
  videoUrl,
  author,
  views = 0,
  likes = 0,
}: OpenGraphTagsProps) => {
  useEffect(() => {
    const videoPageUrl = `https://utubchat.com/video/${videoId}`;
    
    // Update or create meta tags
    const metaTags = [
      // Open Graph
      { property: 'og:type', content: 'video.other' },
      { property: 'og:url', content: videoPageUrl },
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: thumbnailUrl },
      { property: 'og:image:width', content: '1200' },
      { property: 'og:image:height', content: '630' },
      { property: 'og:video', content: videoUrl },
      { property: 'og:video:secure_url', content: videoUrl },
      { property: 'og:video:type', content: 'video/mp4' },
      { property: 'og:site_name', content: 'uTubChat' },
      
      // Twitter Card
      { name: 'twitter:card', content: 'player' },
      { name: 'twitter:site', content: '@utubchat' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: thumbnailUrl },
      { name: 'twitter:player', content: videoPageUrl },
      { name: 'twitter:player:width', content: '1280' },
      { name: 'twitter:player:height', content: '720' },
      
      // Additional meta
      { name: 'description', content: description },
      { name: 'author', content: author.name },
    ];

    metaTags.forEach(({ property, name, content }) => {
      const attribute = property ? 'property' : 'name';
      const value = property || name;
      let meta = document.querySelector(`meta[${attribute}="${value}"]`) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute(attribute, value);
        document.head.appendChild(meta);
      }
      
      meta.setAttribute('content', content);
    });

    // Update canonical link
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', videoPageUrl);

    // Update page title
    document.title = `${title} - uTubChat`;

  }, [videoId, title, description, thumbnailUrl, videoUrl, author, views, likes]);

  return null;
};
