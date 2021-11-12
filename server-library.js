import * as net from "net";
import * as fs from "fs";
import moment from "moment";

const changePort = (server) => {
  return (serverProperties, newPort) => {
    serverProperties.port = newPort;
    server.close();
    server.listen(newPort, serverProperties.host);
  };
};

const changeAuthorizedDirectory = (serverProperties) => {
  return (newDirectory) => {
    // Add '.' in front if not present
    serverProperties.directory = "." + newDirectory;
  };
};

const ifPathAuthorized = (path) => {
  let regex = /\/([^\s\/]+\.[a-zA-Z]+)?/g;

  let matchedPath = path.match(regex);

  if (matchedPath !== null && matchedPath[0].length === path.length) return true;
  return false;
};

const sendResponseAndKill = (socket, response) => {
  socket.write(response, () => {
    socket.destroy();
  });
};

const createServer = (serverProperties) => {
  let server = net.createServer();
  server.listen(8080, "localhost");

  // When a new TCP connection has been made with the client
  server.on("connection", (socket) => {
    let request = "";
    let response = "";

    // When the socket remains inactive for 1 sec, process the request and close
    // the connection.
    socket = socket.setTimeout(1000);
    socket.on("timeout", () => {
      // Split the request string into lines
      request = request.split("\r\n");
      // Get the request method and path from the request line
      let [method, path] = request[0].split(" ");

      // If path is unauthorized, send error message to client and end connection
      if (!ifPathAuthorized(path)) {
        response = `HTTP/1.0 401 Unauthorized\r\n` + `Date: ${new moment().format("ddd, D MMM YYYY HH:mm:ss zz")}\r\n\r\n` + `You don't have access to the requested directory.`;
        sendResponseAndKill(socket, response);
      }

      if (method === "GET") {
        // If no file name is present, send contents of current directory
        if (path.length === 1) {
          // When path = '/'
          fs.readdir(serverProperties.directory, (err, files) => {
            if (!err) {
              let filesInDirectory = "";
              files.forEach((file) => {
                filesInDirectory += file + "\n";
              });

              let response = `HTTP/1.0 200 Ok\r\n` + `Date: ${new moment().format("ddd, D MMM YYYY HH:mm:ss zz")}\r\n\r\n` + `${filesInDirectory}`;
              sendResponseAndKill(socket, response);
            } else {
              let response = `HTTP/1.0 500 Internal Server Error\r\n` + `Date: ${new moment().format("ddd, D MMM YYYY HH:mm:ss zz")}\r\n\r\n` + `${err}`;
              sendResponseAndKill(socket, response);
            }
          });
        } else {
          // Otherwise, if file is present in current directory, send contents of file
          // If file doesn't exist in current directory, send error
          fs.readFile(serverProperties.directory + path, (err, data) => {
            if (err) {
              let response = `HTTP/1.0 404 Not Found\r\n` + `Date: ${new moment().format("ddd, D MMM YYYY HH:mm:ss zz")}\r\n\r\n` + `${err}`;
              sendResponseAndKill(socket, response);
            } else {
              let response = `HTTP/1.0 200 Ok\r\n` + `Date: ${new moment().format("ddd, D MMM YYYY HH:mm:ss zz")}\r\n\r\n` + `${data}`;
              sendResponseAndKill(socket, response);
            }
          });
        }
      } else {
        // 'POST' request

        // If no filename in path, send error response
        if (path.length === 1) {
          response = `HTTP/1.0 400 Bad Request\r\n` + `Date: ${new moment().format("ddd, D MMM YYYY HH:mm:ss zz")}\r\n\r\n` + `Provide file name in url.`;
          sendResponseAndKill(socket, response);
        } else {
          // Otherwise, keep the file contents saved in a file
          // TODO: write new data in a new line
          fs.writeFile(serverProperties.directory + path, '\n'+request[request.length - 1], { flag: "a" }, (err) => {
            if (err) {
              let response = `HTTP/1.0 500 Internal Server Error\r\n` + `Date: ${new moment().format("ddd, D MMM YYYY HH:mm:ss zz")}\r\n\r\n` + `${err}`;
              sendResponseAndKill(socket, response);
            } else {
              let response = `HTTP/1.0 200 Ok\r\n` + `Date: ${new moment().format("ddd, D MMM YYYY HH:mm:ss zz")}\r\n\r\n` + `Data appended`;
              sendResponseAndKill(socket, response);
            }
          });
        }
      }
    });

    // Receive request from client
    socket.on("data", (data) => {
      request += data;
    });
  });

  return server;
};

export { createServer, changePort, changeAuthorizedDirectory };
