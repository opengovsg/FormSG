FROM grafana/k6:2.2.0
LABEL maintainer="Open Government Products"

COPY build/scenarios /scripts/scenarios

ENTRYPOINT ["k6"]
CMD ["run", "/scripts/scenarios/smoke.js"]
