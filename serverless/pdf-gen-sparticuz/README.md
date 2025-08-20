# PDF Generator Lambda
Converts HTML input into a PDF output. 
This is used for eg, payment invoice and auto-reply PDF generation. 

# Local development setup  

> Warning for Apple Silicon Users: You must ensure that your docker endpoint architecture supports `x86_64` for compatibility issues with @sparticuz/chromium.

## For Colima Users 

1. Run `npm run dev:colima` 
The lambda service will listen on `localhost:9997` and the function name by default will be `pdf-gen-sparticuz-dev`. 

### Manual setup 
1. Create a new Docker context profile for x86_64 architecture `colima start --arch x86_64 x86`
NOTE: Due to emulation, there is some performance tradeoff expected. Hence, expect higher latency running locally. 
2. Configure DOCKER_HOST environment variable to use the docker context.  
AWS SAM local commands check for the existence of DOCKER_HOST. Hence, we need to configure this before running. 
`export DOCKER_HOST=$(docker context inspect colima-x86 --format '{{.Endpoints.docker.Host}}')`
3. Run `npm run dev` 
The lambda service will listen on `localhost:9997` and the function name by default will be `pdf-gen-sparticuz-dev`. 

## For Podman and Docker Desktop Users 
1. Configure DOCKER_HOST environment variable to use the docker context.  
Set DOCKER_HOST environment variable with a Docker Endpoint that is capable of running x86_64 containers for the terminal running `npm run dev` is compatible with x86_64. 
2. Run `npm run dev` 
The lambda service will listen on `localhost:9997` and the function name by default will be `pdf-gen-sparticuz-dev`. 

# Testing the local function  
You may use curl to test the service or directly invoke it using FormSG. 

## Sample test: 
```
curl -X POST http://localhost:9997/2015-03-31/functions/pdf-gen-sparticuz-dev/invocations -H "Content-Type: application/json" -d '{"html": "<html><body><h1>Test</h1></body></html>"}';
```

# Deployment 

## Deploying via Github Actions 
Push to a branch with a valid actions workflow configured. 
The deployment should start automatically to the corresponding environment. 

## Deploying locally
1. Connect to aws
`export AWS_PROFILE=<profle> && aws sso login`

2. Deploy using AWS SAM to desired environment
`npm run sam-deploy -- --config-env <env listed in samconfig.yaml eg, stg-alt3>`

## Tearing down for a specific environment
1. Get the stack name for the environment. 
This should be pdf-gen-sparticuz-<env name eg, stg-alt3>. For more info, refer to the stack names defined for each env in samconfig.yml. 

2. Run the SAM delete command  
`sam delete --stack-name  pdf-gen-sparticuz-stg-alt3`