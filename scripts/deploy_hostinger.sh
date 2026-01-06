#!/bin/bash

# Configuration
HOST="72.61.43.72"
USER="root"
REPO="https://github.com/Kevengrf/Asfus-Mobile.git"
REMOTE_DIR="/var/www/Asfus-Mobile"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Starting Deployment to $HOST...${NC}"

# 1. Load Local Environment Variables
if [ -f .env.local ]; then
  echo "Loading local .env.local..."
  # Clean read of env vars to avoid issues
  export $(grep -v '^#' .env.local | xargs)
else
  echo -e "${RED}Error: .env.local not found locally!${NC}"
  exit 1
fi

# 2. execute Remote Commands via SSH
# We use a Heredoc passed to SSH. 
# construct the env file content first to avoid complex escaping in the heredoc
ENV_FILE_CONTENT="NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY"

# Check dependencies locally to fail fast? No, assume remote needs setup.
# Note: This requires the user to input password if keys are not set up.

ssh -t $USER@$HOST bash -c "'
set -e

echo \"[Remote] Checking requirements...\"
# Install Node.js 20
if ! command -v node &> /dev/null; then
  echo \"[Remote] Installing Node.js 20...\"
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs git
fi

# Install PM2
if ! command -v pm2 &> /dev/null; then
  echo \"[Remote] Installing PM2...\"
  sudo npm install -g pm2
fi

# Setup Directory
mkdir -p /var/www
if [ -d \"$REMOTE_DIR\" ]; then
  echo \"[Remote] Updating repository...\"
  cd \"$REMOTE_DIR\"
  git pull origin main
else
  echo \"[Remote] Cloning repository...\"
  cd /var/www
  git clone \"$REPO\"
  cd \"$REMOTE_DIR\"
fi

# DEBUG: Check remote commit
echo "[Remote] Current Commit on Server:"
git log -1

# DEBUG: Verified file content on disk
echo "[Remote] Verifying code on disk..."
if grep -q "addDependent" src/app/register/page.tsx; then
  echo "[Remote] SUCCESS: 'addDependent' found in page.tsx"
else
  echo "[Remote] CRITICAL ERROR: New code NOT found in page.tsx!"
  # Force hard reset
  git fetch --all
  git reset --hard origin/main
fi

# Write .env.local
echo \"[Remote] Updating .env.local...\"
cat > .env.local <<EOL
$ENV_FILE_CONTENT
EOL

# Install & Build
echo \"[Remote] Installing dependencies...\"
npm install

echo \"[Remote] Cleaning cache and Building...\"
rm -rf .next
npm run build

# Restart PM2 - HARD RESET
echo "[Remote] Managing process - Hard Reset..."
pm2 delete asfus-mobile || true
pm2 start npm --name "asfus-mobile" -- start -- --port 3000
pm2 save
pm2 startup

echo \"[Remote] Deployment Success!\"
'"

echo -e "${GREEN}Deployment Finished! Application should be available at http://$HOST:3000${NC}"
