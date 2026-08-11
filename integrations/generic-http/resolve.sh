#!/bin/sh
curl --fail-with-body \
  --request POST \
  --header 'content-type: application/json' \
  --data '{"merchant_url":"https://merchant.atomandbits.com","client_id":"direct-http/example"}' \
  'https://api.merchant.atomandbits.com/v1/resolve'
