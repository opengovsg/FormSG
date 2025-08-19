# PDF Generator Lambda
Converts HTML input into a PDF output. 
This is used for eg, payment invoice and auto-reply PDF generation. 

# Local testing 

## Setup (for M Series Apple Silicon Users Only)

> Warning for Apple Silicon Users: You must ensure that your architecture is `x86_64` for compatibility issues with @sparticuz/chromium. Otherwise, skip this setup step. 

## For Colima Users 
1. Set your architecture to x86_64 `colima start --arch x86_64 --vm-type=vz --vz-rosetta`
2. (optional) To run the above command, you may need to first reset your colima config by running `colima delete` 
NOTE: Due to emulation, there is some performance tradeoff expected. Hence, expect higher latency running locally.  

## Running locally 
Run `npm run dev` 
The lambda service will listen on `localhost:9997` and the function name by default will be `pdf-gen-sparticuz-dev`. 

You may use curl to test the service or directly invoke it using FormSG. 

Sample test: 
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