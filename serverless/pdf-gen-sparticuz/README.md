# PDF Generator
Converts HTML input into a PDF output. 

This is used for eg, payment invoice and auto-reply PDF generation. 

# Deployment 

# Deploying via Github Actions 
Push to a branch with a valid actions workflow configured. 
The deployment should start automatically to the corresponding environment. 

# Deploying locally
1. Open a new terminal instance

2. Specify a environment (in Serverless, envs are referred to as 'stages') to deploy the function to. 
```
export ENV=stg
```

Other valid environment names include for example: `stg-alt3`. 
This causes the function to be deployed as `<function-name>-stg-<function-name>` 

3. Configure serverless AWS credentials locally
```
# Ensure AWS_PROFILE env variable is not set, as it interferes with serverless's AWS credentials resolution by looking in the  ~/.aws/credentials file. To do so, run: `export AWS_PROFILE=`
aws sso login --profile <profile>

eval "$(aws configure export-credentials --profile <profile> --format env)"
```

4. Run the deploy script
```
npm run deploy
```  
