FROM mongo:4
RUN mkdir /config
WORKDIR /config
COPY wait-for-it.sh .
# COPY init-mongo.js .
# COPY init-mongo.sh .
COPY mongo-setup.js .
COPY mongo-setup.sh .
RUN chmod +x /config/wait-for-it.sh
RUN chmod +x /config/mongo-setup.sh
# RUN chmod +x /config/init-mongo.sh
CMD [ "bash", "-c", "/config/wait-for-it.sh mongodb1:27017 -- /config/mongo-setup.sh"]
# CMD [ "bash", "/config/init-mongo.sh"]
