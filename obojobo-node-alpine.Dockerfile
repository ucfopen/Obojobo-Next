# =====================================================================================================
# Base stage used for  build and final stages
# =====================================================================================================
FROM node:12.11.1-alpine AS BASE_STAGE

# ======== PUT NEW NODE BIN DIR IN PATH
RUN npm config set prefix '/home/node/.npm-global'
ENV PATH=/home/node/.npm-global/bin:${PATH}

# =====================================================================================================
# build stage adds files that we dont want in the final stage
# =====================================================================================================
FROM BASE_STAGE as BUILD_STAGE

RUN apk add --no-cache git

# ======== INSTALL PM2 Globally
RUN npm install --global pm2@^4.5.1

# ======== CREATE A PLACE TO STORE OUR LOCAL OBO MONOREPO NPM PACKAGES
RUN mkdir /tmp/packed

# ======== COPY MONOREPO IN
COPY --chown=node:node / /tmp/monorepo-src/

# ======== COPY PM2 SERVER WRAPPER INTO HOME DIR
COPY --chown=node:node docker/obojobo-pm2-server-src /home/node/obojobo/

#========= INSTALL & BUILD ASSETS
WORKDIR /tmp/monorepo-src/
RUN yarn install
RUN yarn build

#========= CREATE LOCAL OBO MONOREPO NPM PACKAGES
# These act like npm packages, but sourced from a local directory instead of npmjs.com
# This is done so we don't have to npm publish to create a working docker image
RUN yarn lerna exec "yarn pack --filename /tmp/packed/\$LERNA_PACKAGE_NAME.tgz"

# ======== PM2 SERVER WRAPPER INSTALL, ADDS LOCAL OBO MONOREPO NPM PACKAGES
WORKDIR /home/node/obojobo/
RUN yarn add /tmp/packed/*.tgz
RUN yarn --production=true

# =====================================================================================================
# final stage creates the final deployable image
# =====================================================================================================
FROM BASE_STAGE as FINAL_STAGE

# ======== COPY GLOBAL NODE STUFF
COPY --chown=node:node --from=BUILD_STAGE /home/node/.npm-global /home/node/.npm-global

# ======== COPY FINAL APP
COPY --chown=node:node --from=BUILD_STAGE /home/node/obojobo/ /home/node/obojobo/

WORKDIR /home/node/obojobo/
USER node

# ======== Run via PM2 for memory restarts
CMD ["pm2-runtime", "start", "ecosystem.config.js"]
