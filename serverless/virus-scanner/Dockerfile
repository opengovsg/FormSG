FROM node:18.18.2-buster-slim

# Install aws-lambda-cpp build dependencies
RUN apt-get update && \
  apt-get install -y \
  g++ \
  make \
  cmake \
  unzip \
  libcurl4-openssl-dev \
  clamav \
  clamav-daemon \
  autoconf \
  libtool \
  automake \ 
  python3

WORKDIR /function

# install app dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Point clamav log and socket to /tmp folder
RUN sed -i 's/LogFile \/var\/log\/clamav\/clamav.log/LogFile \/tmp\/clamav.log/g' /etc/clamav/clamd.conf
RUN sed -i 's/LocalSocket \/var\/run\/clamav\/clamd.ctl/LocalSocket \/tmp\/clamd.ctl/g' /etc/clamav/clamd.conf

# !! Below comment was taken from care360 repo where the virus scanner was forked from!!
# This is a hack to give the default lambda user permissions write access to the Local UNIX socketfile and logfile
# The appropriate GID (990) and User (sbx_user1051) to add was found out through logging the user info at lambda runtime
# GID and User is assumed to be deterministic and hence can be hardcoded
# An alternative would be to get the current user + group details at runtime at the app level code, then run clamd
# If the function breaks in the future because GID / User is non-deterministic, experiment with executing command at app runtime
ARG IS_LAMBDA="true"
RUN if [ "${IS_LAMBDA}" = "true" ]; then  \
  sed -i "s/LocalSocketGroup clamav/LocalSocketGroup 990/g" /etc/clamav/clamd.conf; \
  sed -i "s/User clamav/User sbx_user1051/g" /etc/clamav/clamd.conf; \
  sed -i "s/AllowSupplementaryGroups clamav/AllowSupplementaryGroups true/g" /etc/clamav/clamd.conf; \
  fi

# update clamav and virus definitions
RUN freshclam

COPY . .
RUN npm run build

# Add lambda rie to run entry.sh shell script
ADD https://github.com/aws/aws-lambda-runtime-interface-emulator/releases/latest/download/aws-lambda-rie /usr/bin/aws-lambda-rie

RUN chmod +x /usr/bin/aws-lambda-rie
RUN chmod +x entry.sh

ENTRYPOINT ["sh", "entry.sh", "build/index.handler"]
