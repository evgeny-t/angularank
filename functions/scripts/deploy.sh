gcloud beta functions deploy getState --stage-bucket evgenyt-1233 --trigger-http

gcloud beta functions deploy prepareStats \
  --stage-bucket evgenyt-1233 --trigger-topic=prepareStats \
  --timeout=9m --memory=1024MB

gcloud beta functions deploy processRepo \
  --stage-bucket evgenyt-1233 --trigger-topic=processRepo \
  --timeout=9m --memory=1024MB

gcloud beta functions deploy updateUser \
  --stage-bucket evgenyt-1233 --trigger-topic=updateUser \
  --timeout=9m --memory=1024MB
