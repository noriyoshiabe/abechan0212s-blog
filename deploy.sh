#!/usr/bin/env bash

set -e

source .env

if [ "$(cd $(dirname $0); pwd)" != "$(pwd)" ]; then
  echo "Run $0 from its directory."
  exit 1
fi

case $1 in
  "prd" )
    STAGE=production
    BUCKET=$PRODUCTION_BUCKET
    DISTRIBUTION_ID=$PRODUCTION_DISTRIBUTION_ID
    ;;
  "stg" )
    STAGE=staging
    BUCKET=$STAGING_BUCKET
    DISTRIBUTION_ID=$STAGING_DISTRIBUTION_ID
    ;;
  * )
    echo "Need environment (prd|stg)"
    exit 1
    ;;
esac

yarn clean && STAGE=$STAGE yarn build:prod
aws s3 sync --delete dist/ s3://$BUCKET
aws cloudfront create-invalidation --distribution-id $DISTRIBUTION_ID --paths "/*"
