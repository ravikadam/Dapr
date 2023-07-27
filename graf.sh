docker run -d -p 3001:3000 --name=grafana \
  --volume grafana-storage:/var/lib/grafana \
   -e "GF_INSTALL_PLUGINS=influxdata-flightsql-datasource" \
  grafana/grafana-oss
