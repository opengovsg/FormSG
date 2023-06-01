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

This should only happen if your MongoDB volume was created before [#4603](https://github.com/opengovsg/FormSG/pull/4603).

To fix this issue, either delete and re-create the MongoDB volume, or follow these steps:

1. Login to the docker container using `docker exec -it <mongodb-container-id> /bin/sh`
2. Start the mongodb shell with `mongosh`.
3. Run the following commands within `mongosh` to force set the IP address within the replica set:

```
conf = rs.config()
conf.members[0].host = 'database:27017'
rs.reconfig(conf, {force:true})
```

## `TypeError: Cannot read property 'tap' of undefined`

If you are using a machine with an M1 chip, you may be facing this issue due to your `node` installation, as an inappropriate version of `node` would cause more updated versions of `webpack` to be installed and thus introduces breaking changes in the code.

To overcome this, use Rosetta to install `node` in -x86_64 architecture as described in the "Macs with M1 chip" section [here](https://github.com/nvm-sh/nvm#macos-troubleshooting).

Be sure to check that the correct `node` is installed with:

```bash
$ node -p process.arch
x64
```

## `npm` not found

Make sure `nvm` is loaded to the environment in `~/.bash_profile`. To do so, the `~/.bash_profile` should include the following lines:

```bash
export NVM_DIR=~/.nvm
source $(brew --prefix nvm)/nvm.sh
```

Ensure that on startup, `brew` is added to the environment variables and `~/.bash_profile` is run. To do so, `~/.zshrc` should have the following lines:

```bash
export PATH=/opt/homebrew/bin:$PATH
source ~/.bash_profile
```
