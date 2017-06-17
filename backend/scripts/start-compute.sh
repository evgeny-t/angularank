#!/usr/bin/env bash

cat angularank.yaml | envsubst > /tmp/angularank.yaml

gcloud compute instances create angularank \
  --image container-vm \
  --zone europe-west2-a \
  --metadata-from-file google-container-manifest=/tmp/angularank.yaml \
  --machine-type f1-micro
  