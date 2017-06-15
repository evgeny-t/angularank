gcloud beta functions deploy getState --stage-bucket evgenyt-1233 --trigger-http
gcloud beta functions deploy prepareStats --stage-bucket evgenyt-1233 --trigger-topic=prepare-stats
gcloud beta functions deploy prepareMetrics --stage-bucket evgenyt-1233 --trigger-topic=prepare-metrics
