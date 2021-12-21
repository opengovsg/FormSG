FROM mongo:4.0

COPY init.json /init.json
COPY wait-for-it.sh /.
COPY init-mongo.sh /.
RUN chmod +x /wait-for-it.sh 
RUN chmod +x /init-mongo.sh 
CMD [ "bash", "-c", "/wait-for-it.sh database:27017 -- /init-mongo.sh"]