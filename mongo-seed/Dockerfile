FROM mongo:4.0

COPY init.json /init.json
CMD mongoimport --host database --db formsg --collection agencies --type json --file /init.json --jsonArray