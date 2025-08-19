# PDF Generator
Converts HTML input into a PDF output. 

This is used for eg, payment invoice and auto-reply PDF generation. 

# Deployment 

## Deploying via Github Actions 
Push to a branch with a valid actions workflow configured. 
The deployment should start automatically to the corresponding environment. 

## Deploying locally
1. Connect to aws
`export AWS_PROFILE=<profle> && aws sso login`

2. Deploy using AWS SAM to desired environment

Replace the placeholders in `Environmen=<env>` and `--stack-name pdf-gen-sparticuz-<env>` 

```
npm run ci-sam-deploy -- --parameter-overrides Environment=stg-alt3 --stack-name pdf-gen-sparticuz-stg-alt3
```

For example: 
`npm run ci-sam-deploy -- --parameter-overrides Environment=stg-alt3 --stack-name pdf-gen-sparticuz-stg-alt3` for stg-alt3 deployment. 

## Tearing down for a specific environment
1. Get the stack name for the environment. 
This should be pdf-gen-sparticuz-<env name eg, stg-alt3>

2. Run the SAM delete command  
`sam delete --stack-name  pdf-gen-sparticuz-stg-alt3`