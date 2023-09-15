FROM node:18.17-alpine3.18
WORKDIR /srv/app
COPY ./package.json .
COPY ./index-node.js .
RUN npm i
ENTRYPOINT [ "node", "index-node.js" ]
