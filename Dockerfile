FROM node:alpine
MAINTAINER Popov Gennadiy <me@westtrade.tk>
COPY . /etc/cleantalk
WORKDIR /etc/cleantalk
RUN npm install
CMD ["node", "./examples/httpServer"] 
