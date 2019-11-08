# Builder image stage with node 12.8
FROM gxcontainerregistry.azurecr.io/node as builder
# Working directory for the app
WORKDIR /app
# Copying the package json in order to avoid rerun package installation
COPY package*.json ./
# Install all dependencies for this project
RUN npm install
# Copy all contents of this app to the container in /appdoc
COPY . .
# Run build script found in package.json "build"
RUN npm run build

# Build runtime image
FROM gxcontainerregistry.azurecr.io/node as runtime
# Working directory for the app
WORKDIR /app
# Copy all files from build stage (only js sources needed in order to execute app)
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/build ./

# SSH stage
RUN apk update \
  && apk add dialog \
  && apk add openrc \
  && apk update \
  && apk add openssh-server \
  && rc-status && touch /run/openrc/softlevel \
  && echo "root:Docker!" | chpasswd 

COPY sshd_config /etc/ssh/
COPY init.sh /usr/local/bin/
RUN chmod u+x /usr/local/bin/init.sh

## Expose port of app and ssh port
EXPOSE 80 2222
## Initilize ssh and app
CMD ["init.sh"]
