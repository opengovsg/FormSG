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
