# Troubleshooting issues on local development

A list of common issues that developers face and how to resolve them.

## `Error: Module did not self-register.`

This could happen if node modules were compiled with a different version of node, or if node modules fail to compile due to other configuration errors.

### [Configuration Errors](https://stackoverflow.com/questions/21656420/failed-to-load-c-bson-extension)

Some modules such as `node-gyp` require Python 2.x and if your system's Python points to 3.x, it will fail to compile bson, without warning. Fix this by setting Python 2.x to be the default on your system or ensuring that the Python global key in your npm config points to the 2.x executable on your system.

### [Node Versioning Error](https://stackoverflow.com/questions/28486891/uncaught-error-module-did-not-self-register)

Run the following commands to set the node version and then re-install the node modules:

```
nvm use 12.18.0
rm -r node_modules
npm install
```



