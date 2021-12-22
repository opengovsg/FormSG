FROM mongo:4.0

COPY init.json /init.json
COPY setup.sh /.
RUN chmod +x /setup.sh
ENTRYPOINT ["/setup.sh"]