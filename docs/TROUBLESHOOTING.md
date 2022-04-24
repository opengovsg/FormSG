# Troubleshooting issues on local development

A list of common issues that developers face and how to resolve them.

## `Error: Module did not self-register.`

This could happen if node modules were compiled with a different version of node, or if node modules fail to compile due to other configuration errors.
Running tests locally requires `node` to specifically be the latest version of NodeJS 14. You can use `nvm` to manually set the node version.

### [Node Versioning Error](https://stackoverflow.com/questions/28486891/uncaught-error-module-did-not-self-register)

Run the following commands to set the node version and then re-install the node modules:

```
nvm use 14
rm -r node_modules
npm install
```

## JavaScript out of memory error

On your Docker application, go to Preferences > Resources and increase the amount of memory allocated for Docker.

## MongoDB: not primary and secondaryOk=false

If you cannot login to the app and see an `MongoError: not primary and secondaryOk=false` error in the console, then your Mongo container is configured incorrectly.

This is most likely due to the replicaSet being misconfigured with the wrong IP address of the MongoDB container.

To fix this issue, follow these steps:

1. Retrieve the container ID of the mongodb container using `docker ps`,
2. Retrieve the IP address of the container `docker inspect -f '{{range.NetworkSettings.Networks}}{{.IPAddress}}{{end}}' <mongodb-container-id>`.
3. Login to the docker container using `docker exec -it <mongodb-container-id> /bin/sh`
4. Start the mongodb shell with `mongosh`.
5. Look at the replica set configuration by entering `rs.config()`. Look to see if the IP address listed is different than the one in step 2.
6. Run the following commands within `mongosh` to force set the IP address within the replica set:

```
conf = rs.config()
conf.members[0].host = '<ip-address>:27017'
rs.reconfig(conf, {force:true})
```