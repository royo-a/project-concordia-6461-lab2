import { createInterface } from 'readline';
import { createServer, changePort, changeAuthorizedDirectory } from "./server-library.js";

// The server
const serverProperties = {
  port: 8080,
  host: "localhost",
  directory: ".",
};
const server = createServer(serverProperties);

const changeServerPort = changePort(server);
const changeServerAuthorizedDirectory = changeAuthorizedDirectory(serverProperties);

// httpfs
const inputRegex = /httpfs(( help)|(( -v)?( -p [0-9]+)?( -d (\/[^\/\s]*)+)?))/gi;

const ifStructureOk = (input) => {
  let matchedString = input.match(inputRegex);
  return matchedString ? matchedString[0].length === input.length : false;
};

let rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "httpfs > ",
});

rl.prompt();
// Take user input
rl.on("line", (line) => {
  // On user input, check if input syntax is correct
  // If input doesn't have correct syntax, show error
  if (!ifStructureOk(line)) {
    console.log('Format error: The command or URL isn\'t correct! For help with command, type "httpfs help".');
    rl.prompt();
    return;
  }

  let splitInputArray = line.split(" ");
  if (splitInputArray[1] === "help") {
    let helpString = `httpfs is a simple file server.
    usage: httpfs [-v] [-p PORT] [-d PATH-TO-DIR]
       -v   Prints debugging messages.
       -p   Specifies the port number that the server will listen and serve at.
            Default is 8080.
       -d   Specifies the directory that the server will use to read/write
    requested files. Default is the current directory when launching the
    application.`
    console.log(helpString);
    rl.prompt();
  } else {
    let isVerbose = false;
    let verboseString = "Server properties has been changed. ";
    splitInputArray.forEach((input, index) => {
      if (input === "-v") {
        isVerbose = true;
      } else if (input === "-d") {
        changeServerAuthorizedDirectory(splitInputArray[index + 1]);
        verboseString += `New directory: ${splitInputArray[index + 1]}. `;
      } else if (input === "-p") {
        changeServerPort(serverProperties, Number.parseInt(splitInputArray[index + 1]));
        verboseString += `New port: ${splitInputArray[index + 1]}.`;
      }
    });

    if (isVerbose) console.log(verboseString);
    rl.prompt();
  }
});
