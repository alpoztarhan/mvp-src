FROM node:16

# Create app directory
WORKDIR /usr/src/app/

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
#COPY package*.json ./
COPY package.json /usr/src/app


#test esnasında ci kullanalım
#RUN npm ci
RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
#COPY . .
COPY . /usr/src/app

EXPOSE 8083
# CMD [ "node", "server.js" ]
# CMD [ "npm", "start" ]
CMD [ "npm", "run", "live" ]