-- Add smart collection support to collections table
ALTER TABLE collections
ADD COLUMN is_smart BOOLEAN DEFAULT false,
ADD COLUMN rule_type TEXT,
ADD COLUMN rule_config JSONB;

-- Add comment for documentation
COMMENT ON COLUMN collections.is_smart IS 'Whether this is a smart collection with automatic rules';
COMMENT ON COLUMN collections.rule_type IS 'Type of smart collection rule: followed_users, trending, recent_likes, etc.';
COMMENT ON COLUMN collections.rule_config IS 'JSON configuration for the rule (e.g., time period, filters)';

-- Create index for smart collections queries
CREATE INDEX idx_collections_smart ON collections(is_smart, rule_type) WHERE is_smart = true;