#!/bin/bash
# Deploy to Netlify

# Set these environment variables before running:
# export NETLIFY_AUTH_TOKEN=your_token_here
# export NETLIFY_SITE_ID=your_site_id_here

if [ -z "$NETLIFY_AUTH_TOKEN" ] || [ -z "$NETLIFY_SITE_ID" ]; then
    echo "❌ Error: Set NETLIFY_AUTH_TOKEN and NETLIFY_SITE_ID environment variables"
    exit 1
fi

echo "🚀 Deploying ÆSI to Netlify..."
echo "   Site ID: $NETLIFY_SITE_ID"

# Deploy using Netlify CLI
netlify deploy \
    --site=$NETLIFY_SITE_ID \
    --auth=$NETLIFY_AUTH_TOKEN \
    --prod \
    --dir=./ \
    --message="🜂 ÆSI Auto-Deploy $(date)"

echo "✅ Deployment complete!"
echo "🌐 Visit: https://$NETLIFY_SITE_ID.netlify.app"
