FROM node:6.9

WORKDIR /app/
ENV NODE_ENV production

ADD package.json /app/package.json
RUN npm install -D

ADD . /app/

CMD ["/app/node_modules/.bin/pm2", "start", "app.js", "--no-daemon"]
