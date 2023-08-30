FROM node:20-alpine3.17

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

EXPOSE 5000

CMD npx -y prisma@5.1.1 migrate dev --name init;node ./dist/index.mjs
