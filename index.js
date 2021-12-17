const fs = require("fs");

const gruopedByTeamPath = "../../ouput";

const writeSream = fs.createWriteStream(gruopedByTeamPath);

function streamToString(fStream, sStream, cb) {
  return new Promise((resolve) => {
    const errorChunks = [];
    let ownerChunks = [];

    fStream.on("data", (chunk) => {
      errorChunks.push(chunk.toString());
    });

    fStream.on("end", () => {
      sStream.on("data", (chunk) => {
        ownerChunks = chunk
          .split("\n")
          .filter((val) => val.includes("@"))
          .map((val) => val.replaceAll("**", "").replaceAll("*", ""))
          .reduce((acc, val) => {
            const [path, owner] = val.split(" ");
            acc[owner]
              ? (acc[owner] = [...acc[owner], path])
              : (acc[owner] = [path]);
            return acc;
          }, {});
      });

      sStream.on("end", () => {
        cb(JSON.parse(errorChunks.join("")), ownerChunks);
        resolve("done!");
      });
    });
  });
}

const writeIntoFile = (errors, owners) => {
  const gruoped = Object.entries(owners).reduce((acc, [key, value]) => {
    const gruopedTest = Object.entries(errors).reduce(
      (errAcc, [errKey, errVal]) => {
        errVal.forEach((error) => {
          value.forEach((path) => {
            if (error.includes(path.trim())) {
              errAcc[errKey] = errAcc[errKey]
                ? [...errAcc[errKey], error]
                : [error];
            }
          });
        });
        return errAcc;
      },
      {}
    );
    acc[key] = acc[key] ? { ...acc[key], ...gruopedTest } : gruopedTest;
    return acc;
  }, {});

  writeSream.write(JSON.stringify(gruoped, null, 2));
};

const waitForWriting = async (resultUrl, codeOwnerPath) => {
  const readErrorStream = fs.createReadStream(resultUrl, "utf8");
  const readCodeownersStream = fs.createReadStream(codeOwnerPath, "utf8");
  const res = await streamToString(
    readErrorStream,
    readCodeownersStream,
    writeIntoFile
  );
  return res;
};

console.log("linter check is running...");

module.exports = waitForWriting;
