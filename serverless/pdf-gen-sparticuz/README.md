# PDF Generator Lambda
Converts HTML input into a PDF output. 
This is used for eg, payment invoice and auto-reply PDF generation. 

# Local development setup  

## Automated setup (Recommended)
1. Run `npm run dev`
The lambda service be started and will listen on `localhost:9997` and the function name by default will be `pdf-gen-sparticuz-dev`. 

## Manual setup 

## For Intel (running on x86_64) users
No special configuration is needed. 
1. Run `npm run dev` 

## For Apple Silicon Users (running on aarch64)
> Warning for Apple Silicon Users: You must ensure that your docker endpoint architecture supports `x86_64` for compatibility issues with @sparticuz/chromium.

### For Colima Users 
1. Create a new colima profile for x86_64 architecture `colima start --arch x86_64 x86`
NOTE: Due to emulation, there is some performance tradeoff expected. Hence, expect higher latency running locally. 

2. Configure DOCKER_HOST environment variable to use the x86_64-compatible daemon.  
AWS SAM local commands check for the existence of DOCKER_HOST. Hence, we need to configure this before running. 
`export DOCKER_HOST=$(docker context inspect colima-x86 --format '{{.Endpoints.docker.Host}}')`
3. Run `npm run dev` 

### For Podman Users
Podman is able to setup the required emulation for x86_64 despite running on aarch64 automatically - no special configuration is required.  
1. Run `npm run dev` 

# Testing the local function  
You may use curl to test the service or directly invoke it using FormSG. 

## Sample test: 
Run the following command in your terminal
```
curl -X POST http://localhost:9997/2015-03-31/functions/pdf-gen-sparticuz-dev/invocations -H "Content-Type: application/json" -d '{"html": "<html><body><h1>Test</h1></body></html>"}';
```

# Deployment 

## Deploying via Github Actions 
Push to a branch with a valid actions workflow configured (look for GH actions workflow file named `deploy-pdf-gen-<branch-name>`). 
The deployment should start automatically to the corresponding environment. 

## Deploying locally
1. Connect to aws
`export AWS_PROFILE=<profle> && aws sso login`

2. Deploy using AWS SAM to desired environment
`npm run sam-deploy -- --config-env <env listed in samconfig.yaml eg, stg-alt3>`

## Tearing down a specific environment
1. Get the stack name for the environment. 
This should be pdf-gen-sparticuz-<env name eg, stg-alt3>. For more info, refer to the stack names defined for each env in samconfig.yml. 

2. Run the SAM delete command  
`sam delete --stack-name  pdf-gen-sparticuz-stg-alt3`