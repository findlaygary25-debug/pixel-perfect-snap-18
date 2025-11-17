import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
  Hr,
} from 'npm:@react-email/components@0.0.22';
import * as React from 'npm:react@18.3.1';

interface FlashSaleEmailProps {
  username: string;
  discount_percentage: number;
  duration_hours: number;
  app_url: string;
}

export const FlashSaleEmail = ({
  username,
  discount_percentage,
  duration_hours,
  app_url,
}: FlashSaleEmailProps) => (
  <Html>
    <Head />
    <Preview>⚡ FLASH SALE ALERT! Get {discount_percentage}% off for the next {duration_hours} hour{duration_hours > 1 ? 's' : ''}!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>⚡ FLASH SALE ACTIVE!</Heading>
        
        <Section style={heroSection}>
          <Text style={heroText}>
            {discount_percentage}% OFF
          </Text>
          <Text style={subHeroText}>
            Premium Items
          </Text>
        </Section>

        <Text style={greeting}>Hey {username}!</Text>
        
        <Text style={text}>
          We've just launched an exclusive flash sale with <strong>{discount_percentage}% off</strong> on premium rewards!
        </Text>

        <Text style={text}>
          This incredible deal is only available for the next <strong>{duration_hours} hour{duration_hours > 1 ? 's' : ''}</strong>, so don't miss out!
        </Text>

        <Section style={featuresSection}>
          <Text style={featureTitle}>What's included:</Text>
          <Text style={featureItem}>✨ Premium Badges</Text>
          <Text style={featureItem}>🎨 Exclusive Cosmetics</Text>
          <Text style={featureItem}>👑 Gold & Platinum Items</Text>
          <Text style={featureItem}>⏰ Limited Time Only</Text>
        </Section>

        <Link
          href={`${app_url}/rewards-store`}
          target="_blank"
          style={button}
        >
          Shop Flash Sale Now
        </Link>

        <Hr style={hr} />

        <Text style={urgencyText}>
          ⏰ Hurry! This flash sale ends in {duration_hours} hour{duration_hours > 1 ? 's' : ''}.
        </Text>

        <Text style={footer}>
          This is an automated notification from Voice2Fire. If you wish to stop receiving flash sale alerts,{' '}
          <Link
            href={`${app_url}/haptic-settings`}
            target="_blank"
            style={{ ...link, color: '#898989' }}
          >
            manage your notification preferences
          </Link>
          .
        </Text>
      </Container>
    </Body>
  </Html>
);

export default FlashSaleEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
  borderRadius: '8px',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
};

const h1 = {
  color: '#dc2626',
  fontSize: '32px',
  fontWeight: 'bold',
  textAlign: 'center' as const,
  margin: '40px 0 20px',
  padding: '0',
  textTransform: 'uppercase' as const,
};

const heroSection = {
  textAlign: 'center' as const,
  padding: '32px 20px',
  background: 'linear-gradient(135deg, #ef4444 0%, #f97316 50%, #eab308 100%)',
  borderRadius: '8px',
  margin: '20px 20px 40px',
};

const heroText = {
  color: '#ffffff',
  fontSize: '56px',
  fontWeight: 'bold',
  margin: '0',
  lineHeight: '1',
};

const subHeroText = {
  color: '#ffffff',
  fontSize: '24px',
  fontWeight: '600',
  margin: '8px 0 0',
};

const greeting = {
  color: '#333',
  fontSize: '18px',
  fontWeight: '600',
  margin: '24px 20px 16px',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '16px 20px',
};

const featuresSection = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '24px',
  margin: '24px 20px',
};

const featureTitle = {
  color: '#333',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 16px',
};

const featureItem = {
  color: '#555',
  fontSize: '15px',
  margin: '8px 0',
  lineHeight: '24px',
};

const button = {
  backgroundColor: '#dc2626',
  borderRadius: '8px',
  color: '#fff',
  fontSize: '18px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'block',
  padding: '16px 32px',
  margin: '32px 20px',
  boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '32px 20px',
};

const urgencyText = {
  color: '#dc2626',
  fontSize: '16px',
  fontWeight: '600',
  textAlign: 'center' as const,
  margin: '24px 20px',
  padding: '16px',
  backgroundColor: '#fee2e2',
  borderRadius: '8px',
};

const footer = {
  color: '#898989',
  fontSize: '12px',
  lineHeight: '18px',
  margin: '24px 20px',
  textAlign: 'center' as const,
};

const link = {
  color: '#dc2626',
  textDecoration: 'underline',
};
