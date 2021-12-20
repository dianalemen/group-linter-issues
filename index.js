const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const gruopedByTeamPath = `${path.resolve()}/ouput`;
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
            const [filePath, owner] = val.split(" ");
            acc[owner]
              ? (acc[owner] = [...acc[owner], filePath])
              : (acc[owner] = [filePath]);
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
          value.forEach((errPath) => {
            if (error.includes(errPath.trim())) {
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

const waitForWriting = async () => {
  const readCodeownersStream = fs.createReadStream(
    `${path.resolve()}/.github/CODEOWNERS`,
    "utf8"
  );
  const readErrorStream = fs.createReadStream(
    `${path.resolve()}/results.json`,
    "utf8"
  );
  const res = await streamToString(
    readErrorStream,
    readCodeownersStream,
    writeIntoFile
  );
  return res;
};

console.log("linter check is running...");

const runLinterScript = new Promise((resolve, reject) => {
  fs.copyFile(
    "./lint-formatter.js",
    `${path.resolve()}/lint-formatter.js`,
    (err) => {
      if (err) throw err;
      console.log("lint-formatter.js was copied to root");
    }
  );
    exec("npm run test:lint", (error, stdout) => {
             if (error) {
                reject(error);
                return;
            }
            resolve(stdout)
           });
  })

module.exports = () => {
  runLinterScript
    .then(() => {
      console.log("Linter finished! Ouput is creating for you...");
      waitForWriting();
    })
    .catch(err => console.log(err))
    .finally(() => waitForWriting());
};
