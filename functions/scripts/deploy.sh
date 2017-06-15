gcloud beta functions deploy getState --stage-bucket evgenyt-1233 --trigger-http
gcloud beta functions deploy prepareStats \
  --stage-bucket evgenyt-1233 --trigger-topic=prepare-stats \
  --timeout=9m --memory=1024MB
