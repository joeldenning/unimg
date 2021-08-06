import { router } from "./router.js";
import util from "util";
import child_process from "child_process";
import path from "path";
import mkdirp from "mkdirp";
import _rimraf from "rimraf";
import fs from "fs/promises";
import sha256 from "crypto-js/sha256.js";

const exec = util.promisify(child_process.exec);
const rimraf = util.promisify(_rimraf);

router.get("*", async (req, res, next) => {
  const [imageName, ...filePathParts] = req.path
    .split("/")
    .filter((str) => str.trim());
  console.log("Image Name", imageName);
  console.log(req.path);

  if (imageName === "static") {
    return next();
  }

  const dirPath = path.resolve(process.cwd(), `images/${imageName}`);

  const localFilePath = path.resolve(
    process.cwd(),
    "images",
    imageName,
    ...filePathParts
  );

  try {
    console.log("Checking local file path", localFilePath);
    const hash = await fs.readFile(localFilePath);
    console.log("Hash", hash);
    return res.redirect(`/static/${hash}`);
  } catch {}

  const tarPath = path.resolve(
    dirPath,
    path.resolve(process.cwd(), "images/", imageName + ".tar")
  );
  console.log(`mkdirp ${dirPath}`);

  await mkdirp(dirPath);
  await mkdirp(path.resolve(process.cwd(), "static"));

  const dockerRm = `docker rm ${imageName}`;
  console.log(dockerRm);
  try {
    await exec(dockerRm);
  } catch {}

  const dockerCreate = `docker create --name="${imageName}" ${imageName}`;
  console.log(dockerCreate);
  await exec(dockerCreate);
  const dockerExport = `docker export ${imageName} -o ${tarPath}`;
  console.log(dockerExport);
  await exec(dockerExport);
  const tar = `tar xf ${tarPath} --directory ${dirPath}`;
  console.log(tar);
  await exec(tar);

  const files = await getFiles(dirPath);
  console.log(`Processing ${files.length} files`);

  for (let file of files) {
    const hash = sha256(await fs.readFile(file, "utf-8"));
    const destPath = path.resolve(process.cwd(), `static/${hash}`);
    try {
      await fs.access(destPath);
    } catch {
      await fs.copyFile(file, destPath);
    }

    await fs.writeFile(file, hash.toString(), "utf-8");
  }

  // await rimraf(tarPath)
  // await rimraf(dirPath)

  const hash = await fs.readFile(localFilePath);
  res.redirect(`/static/${hash}`);
});

async function getFiles(dir) {
  const subdirs = await fs.readdir(dir);
  const files = await Promise.all(
    subdirs.map(async (subdir) => {
      const res = path.posix.resolve(dir, subdir);
      const stat = await fs.lstat(res);

      if (stat.isSymbolicLink()) {
        // nothing
        return [];
      } else {
        return stat.isDirectory() ? getFiles(res) : res;
      }
    })
  );
  return files.reduce((a, f) => a.concat(f), []);
}
