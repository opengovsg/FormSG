# Local development only. Deployments ship dist/ as a zip via serverless.yml.
# The AWS base image bundles the runtime interface client and emulator, so
# docker-compose.dev.yml can serve the Lambda Invoke API on port 8080.
FROM public.ecr.aws/lambda/nodejs:22

COPY dist/ ${LAMBDA_TASK_ROOT}/

CMD ["index.handler"]
