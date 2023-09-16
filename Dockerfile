FROM node:20-alpine3.17

ARG FUNKALLERO_PORT

# set a directory for the app
WORKDIR /usr/src/app

# copy all the files to the container
COPY . .

# install dependencies
RUN npm install

# generate models
RUN npm run generate

# build project
RUN npm run build

EXPOSE ${FUNKALLERO_PORT}

CMD npx -y prisma@5.1.1 migrate deploy;node ./dist/index.mjs
