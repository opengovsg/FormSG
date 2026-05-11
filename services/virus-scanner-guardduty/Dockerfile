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

# Install pnpm
RUN npm install -g pnpm@10.30.3

WORKDIR /workspace

# Copy workspace config and lockfile from monorepo root
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY services/virus-scanner-guardduty/package.json ./services/virus-scanner-guardduty/

# Install only virus-scanner dependencies
RUN pnpm install --filter formsg-virus-scanner-guardduty

WORKDIR /workspace/services/virus-scanner-guardduty

# Copy virus scanner source
COPY services/virus-scanner-guardduty/ ./

RUN pnpm run build

# Add lambda rie to run entry.sh shell script
ADD https://github.com/aws/aws-lambda-runtime-interface-emulator/releases/latest/download/aws-lambda-rie /usr/bin/aws-lambda-rie

RUN chmod +x /usr/bin/aws-lambda-rie
RUN chmod +x entry.sh

ENTRYPOINT ["sh", "entry.sh", "build/index.handler"]
