FROM node:18.12-bullseye-slim
FROM node:22-bookworm-slim
# Install aws-lambda-cpp build dependencies
RUN apt-get update && \
  apt-get install -y \
  g++ \
  make \
  cmake \
  unzip \
  libcurl4-openssl-dev \
  autoconf \
  libtool \
  automake \ 
  python3

WORKDIR /function

# install app dependencies
COPY package.json package-lock.json ./
RUN npm ci

# !! Below comment was taken from care360 repo where the virus scanner was forked from!!
# This is a hack to give the default lambda user permissions write access to the Local UNIX socketfile and logfile
# The appropriate GID (990) and User (sbx_user1051) to add was found out through logging the user info at lambda runtime
# GID and User is assumed to be deterministic and hence can be hardcoded
# An alternative would be to get the current user + group details at runtime at the app level code, then run clamd
# If the function breaks in the future because GID / User is non-deterministic, experiment with executing command at app runtime
ARG IS_LAMBDA="true"

COPY . .
RUN npm run build

# Add lambda rie to run entry.sh shell script
ADD https://github.com/aws/aws-lambda-runtime-interface-emulator/releases/latest/download/aws-lambda-rie /usr/bin/aws-lambda-rie

RUN chmod +x /usr/bin/aws-lambda-rie
RUN chmod +x entry.sh

ENTRYPOINT ["sh", "entry.sh", "build/index.handler"]
