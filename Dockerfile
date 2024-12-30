# Use an official Node.js runtime as the base image
FROM node:20

# Set the working directory in the container
WORKDIR /app

# Copy the rest of the application code to the working directory
COPY . .

# install pnpm
RUN npm install -g pnpm

# Set the working directory to the web package
WORKDIR /app/packages/web

# Install the application dependencies
RUN pnpm install

# Build the Next.js application
RUN pnpm run build:self-host

# Expose the port on which the application will run
EXPOSE 3000

# Set the command to run the application
CMD ["pnpm", "run", "start"]
