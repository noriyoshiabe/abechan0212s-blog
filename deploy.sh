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
    ;;
  "stg" )
    STAGE=staging
    BUCKET=$STAGING_BUCKET
    ;;
  * )
    echo "Need environment (prd|stg)"
    exit 1
    ;;
esac

yarn clean && STAGE=$STAGE yarn build:prod
aws s3 sync --delete dist/ s3://$BUCKET
