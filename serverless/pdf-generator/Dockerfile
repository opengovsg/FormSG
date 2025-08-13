FROM public.ecr.aws/lambda/nodejs:22

# Install required dependencies for Chrome See: https://github.com/amazonlinux/amazon-linux-2023/discussions/417 and https://github.com/awesome-fc/puppeteer-fc-starter-kit/blob/master/lib/usr/lib/x86_64-linux-gnu/libnspr4.so
RUN dnf update -y && \
    dnf install -y \
    xz \
    tar \
    gzip \
    unzip \
    nss \ 
    libXcomposite \
    libXdamage \
    libXrandr \
    libxkbcommon \
    pango \
    alsa-lib \
    atk \
    at-spi2-atk \
    cups-libs \
    libdrm \
    mesa-libgbm \
    && dnf clean all

COPY package.json package-lock.json ${LAMBDA_TASK_ROOT} 

RUN npm install 
RUN npx @puppeteer/browsers install chrome@latest

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