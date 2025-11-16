import { Helmet } from 'react-helmet-async';

type VideoMetaTagsProps = {
  videoId: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl?: string;
  username: string;
  duration?: string;
  views?: number;
  uploadDate?: string;
};

export const VideoMetaTags = ({
  videoId,
  title,
  description,
  videoUrl,
  thumbnailUrl,
  username,
  duration,
  views,
  uploadDate,
}: VideoMetaTagsProps) => {
  const pageUrl = `https://voice2fire.com/video/${videoId}`;
  const defaultThumbnail = 'https://voice2fire.com/og-image.png';
  const thumbnail = thumbnailUrl || defaultThumbnail;
  const videoTitle = title || `Video by ${username}`;
  const videoDescription = description || `Watch this amazing video by ${username} on Voice2Fire`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{videoTitle} | Voice2Fire</title>
      <meta name="title" content={`${videoTitle} | Voice2Fire`} />
      <meta name="description" content={videoDescription} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content="video.other" />
      <meta property="og:url" content={pageUrl} />
      <meta property="og:title" content={videoTitle} />
      <meta property="og:description" content={videoDescription} />
      <meta property="og:image" content={thumbnail} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:video" content={videoUrl} />
      <meta property="og:video:secure_url" content={videoUrl} />
      <meta property="og:video:type" content="video/mp4" />
      <meta property="og:site_name" content="Voice2Fire" />
      
      {duration && <meta property="og:video:duration" content={duration} />}
      {uploadDate && <meta property="og:video:release_date" content={uploadDate} />}

      {/* Twitter */}
      <meta name="twitter:card" content="player" />
      <meta name="twitter:url" content={pageUrl} />
      <meta name="twitter:title" content={videoTitle} />
      <meta name="twitter:description" content={videoDescription} />
      <meta name="twitter:image" content={thumbnail} />
      <meta name="twitter:player" content={videoUrl} />
      <meta name="twitter:player:width" content="1280" />
      <meta name="twitter:player:height" content="720" />
      <meta name="twitter:player:stream" content={videoUrl} />
      <meta name="twitter:player:stream:content_type" content="video/mp4" />

      {/* Additional Meta Tags */}
      <meta name="author" content={username} />
      {views && <meta name="video:view_count" content={views.toString()} />}
      
      {/* Schema.org for Google+ */}
      <meta itemProp="name" content={videoTitle} />
      <meta itemProp="description" content={videoDescription} />
      <meta itemProp="image" content={thumbnail} />
      <meta itemProp="contentUrl" content={videoUrl} />
      <meta itemProp="embedUrl" content={pageUrl} />
      {uploadDate && <meta itemProp="uploadDate" content={uploadDate} />}

      {/* Canonical URL */}
      <link rel="canonical" href={pageUrl} />
    </Helmet>
  );
};
