# Builder image stage with node 12.8
FROM elevacontainerregistry.azurecr.io/node as builder
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
FROM elevacontainerregistry.azurecr.io/node as runtime
# Declaring name, version, commit and date
ARG NAMET
ARG VERSIONT
ARG COMMITT
ARG DATET
ENV NAMET=$NAMET VERSIONT=$VERSIONT COMMITT=$COMMITT DATET=$DATET
# Working directory for the app
WORKDIR /app
# Copy all files from build stage (only js sources needed in order to execute app)
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/build ./

# Expose Ports HTTP
EXPOSE 80 2222
## Initilize ssh and app
CMD ["init.sh"]