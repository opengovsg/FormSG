if [ ! -f /data/mongo-init.flag ]; then
    echo "Init replicaset"
    # mongo database:27017 --eval "rs.initiate()"
    mongoimport --host database:27017 --db formsg --collection agencies --type json --file init.json --jsonArray
    touch /data/mongo-init.flag
else
    echo "Replicaset already initialized"
fi