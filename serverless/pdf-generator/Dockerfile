FROM public.ecr.aws/lambda/nodejs:22

# Install required dependencies for Firefox
RUN dnf update -y && \
    dnf install -y \
    xz \
    tar \
    gzip \
    unzip \
    && dnf clean all

COPY package.json package-lock.json ${LAMBDA_TASK_ROOT} 

RUN npm install 
RUN npx @puppeteer/browsers install firefox@stable_141.0.3

COPY index.js ${LAMBDA_TASK_ROOT} 

# Set the CMD to your handler (could also be done as a parameter override outside of the Dockerfile)
CMD [ "index.handler" ]

# To build: 
# docker-buildx build --platform linux/amd64 --provenance=false -t docker-image:test .

# To tag and push: 
# docker tag docker-image:test 205930608298.dkr.ecr.ap-southeast-1.amazonaws.com/serverless-pdf-generator-stg-alt3:latest
# docker push 205930608298.dkr.ecr.ap-southeast-1.amazonaws.com/serverless-pdf-generator-stg-alt3:latest

# To see the container contents: 
# docker run -it --entrypoint /bin/bash docker-image:test;