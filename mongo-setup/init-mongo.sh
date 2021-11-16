if [ ! -f /data/mongo-seed.flag ]; then
    echo "Seed replicaset"
    mongo mongodb://mongodb1:27017/formsg init-mongo.js
    touch /data/mongo-seed.flag
else
    echo "Replicaset already seeded"
fi