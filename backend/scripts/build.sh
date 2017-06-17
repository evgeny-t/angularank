#!/usr/bin/env bash

date +%s > .build
docker build -t gcr.io/my-bio-163107/angularank:latest .
gcloud docker -- push gcr.io/my-bio-163107/angularank:latest
