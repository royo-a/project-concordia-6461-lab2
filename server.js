import { createServer, changePort, changeAuthorizedDirectory } from "./server-library.js";

const serverProperties = {
  port: 8082,
  host: "localhost",
  directory: ".",
};

const server = createServer(serverProperties);

const changeServerPort = changePort(server);
const changeServerAuthorizedDirectory = changeAuthorizedDirectory(serverProperties);
