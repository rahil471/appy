FROM node:boron

WORKDIR /usr/src/app

# Copy dependency definitions
COPY package.json /usr/src/app

RUN npm install

RUN npm install gulp -g

# Get all the code needed to run the app
COPY . /usr/src/app

EXPOSE 8125

#RUN gulp seed

CMD ["npm", "start"]