# syntax=docker/dockerfile:1
FROM node:22.23.2-bookworm-slim@sha256:83f487e0a63425e5b4d146fb5e5be574bcbe1b7b843d3ebafdd95eaf7767a7e5

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
RUN npm install -g pnpm@12.4.1

WORKDIR /workspace

# Copy workspace config and lockfile from monorepo root
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY services/virus-scanner-guardduty/package.json ./services/virus-scanner-guardduty/

# Install only virus-scanner dependencies
RUN pnpm install --frozen-lockfile --filter formsg-virus-scanner-guardduty

WORKDIR /workspace/services/virus-scanner-guardduty

# Copy virus scanner source
COPY services/virus-scanner-guardduty/ ./

RUN pnpm run build

# Add lambda rie to run entry.sh shell script.
# Pinned to v1.37 — AWS does not publish a checksum/signature for this
# release, so the sha256 below is self-computed from the v1.37 asset at
# pin time (not a vendor-issued guarantee), to at least catch the asset
# changing unexpectedly at this fixed URL.
ADD --checksum=sha256:6b1e686e62ab2baf5759c412c4864276ef2a88b094fca53ec070637ccba9b9a5 \
    https://github.com/aws/aws-lambda-runtime-interface-emulator/releases/download/v1.37/aws-lambda-rie \
    /usr/bin/aws-lambda-rie

RUN chmod +x /usr/bin/aws-lambda-rie
RUN chmod +x entry.sh

ENTRYPOINT ["sh", "entry.sh", "build/index.handler"]
