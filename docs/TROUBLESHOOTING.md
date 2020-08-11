# Troubleshooting issues on local development

A list of common issues that developers face and how to resolve them.

1. [`Error: Module did not self-register.`](https://stackoverflow.com/questions/21656420/failed-to-load-c-bson-extension)

Some modules such as `node-gyp` require Python 2.x and if your system's Python points to 3.x, it will fail to compile bson, without warning. Fix this by setting Python 2.x to be the default on your system or ensuring that the Python global key in your npm config points to the 2.x executable on your system.





