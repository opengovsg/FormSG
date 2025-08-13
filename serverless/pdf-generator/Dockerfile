FROM public.ecr.aws/lambda/nodejs:22

# Install required dependencies for Chrome See: https://github.com/amazonlinux/amazon-linux-2023/discussions/417 and https://github.com/awesome-fc/puppeteer-fc-starter-kit/blob/master/lib/usr/lib/x86_64-linux-gnu/libnspr4.so
# RUN dnf update -y && \
#     dnf install -y \
#     xz \
#     tar \
#     gzip \
#     unzip \
#     nss \ 
#     libXcomposite \
#     libXdamage \
#     libXrandr \
#     libxkbcommon \
#     pango \
#     alsa-lib \
#     atk \
#     at-spi2-atk \
#     cups-libs \
#     libdrm \
#     mesa-libgbm \
#     fontconfig \
#     dejavu-sans-fonts \
#     dejavu-sans-mono-fonts \
#     dejavu-serif-fonts \
#     liberation-mono-fonts \
#     liberation-sans-fonts \
#     liberation-serif-fonts \
#     google-noto-emoji-fonts \
#     google-noto-fonts-common \
#     google-noto-sans-fonts \
#     google-noto-serif-fonts \
#     ipa-gothic-fonts \
#     ipa-mincho-fonts \
#     ipa-pgothic-fonts \
#     ipa-pmincho-fonts \
#     dbus \
#     && dnf clean all

RUN dnf install -y \
    libX11 \
    libXcomposite \
    libXdamage \
    libXext \
    libXfixes \
    libXrandr \
    alsa-lib \
    atk \
    at-spi2-atk \
    cairo \
    cups-libs \
    dbus \
    liberation-fonts \
    mesa-libgbm \
    gtk3 \
    nss \
    pango \
    systemd-libs \
    vulkan-loader \
    libxcb \
    libxkbcommon \
    xdg-utils

RUN dnf install wget -y
RUN wget https://dl.google.com/linux/direct/google-chrome-stable_current_x86_64.rpm
RUN rpm -i google-chrome-stable_current_x86_64.rpm

COPY package.json package-lock.json ${LAMBDA_TASK_ROOT} 

RUN npm install 

COPY index.js ${LAMBDA_TASK_ROOT} 

# Set the CMD to your handler (could also be done as a parameter override outside of the Dockerfile)
CMD [ "index.handler" ]

# To build: 
# docker-buildx build --platform linux/amd64 --provenance=false -t docker-image:test .

# To tag and push: 
# docker tag docker-image:test 205930608298.dkr.ecr.ap-southeast-1.amazonaws.com/serverless-pdf-generator-stg-alt3:latest
# docker push 205930608298.dkr.ecr.ap-southeast-1.amazonaws.com/serverless-pdf-generator-stg-alt3:latest

# To see the container contents: 
# docker run -it --platform linux/amd64 --entrypoint /bin/bash docker-image:test