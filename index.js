const fs = require("fs");
const path = require("path")
const gruopedByTeamPath = "../../ouput";

const writeSream = fs.createWriteStream(gruopedByTeamPath);
const readCodeownersStream = fs.createReadStream(
  `${path.resolve()}/.github/CODEOWNERS`,
  "utf8");
const readErrorStream = fs.createReadStream(`./results.json`, "utf8");

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
  const res = await streamToString(
    readErrorStream,
    readCodeownersStream,
    writeIntoFile
  );
  return res;
};

console.log("linter check is running...");

module.exports = () => {
  try {
    const res = exectSync("npm run test:lint");
    console.log("success", linter.toString());
    console.log("success", res.toString());
  } catch (err) {
    console.log("ERROR: A compile log of this file can be found in output");
  } finally {
    console.log("Linter finished! Ouput is creating for you...");
    waitForWriting();
  }
};
