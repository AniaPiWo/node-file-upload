import express from "express";
import Jimp from "jimp";
import fs from "fs/promises";
import path from "path";
import multer from "multer";
import { v4 as uuidV4 } from "uuid";

const PORT = 3000;

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));

const tempDir = path.join(process.cwd(), "temp"); //cwdf - current work directory
const storeImageDir = path.join(process.cwd(), "public/images");

const storage = multer.diskStorage({
  destination: tempDir,
  filename: (req, file, cb) => {
    const [, extension] = file.originalname.split(".");
    cb(null, `${uuidV4()}.${extension}`);
  },
});

const isAccessible = async (path) => {
  try {
    await fs.access(path);
    return true;
  } catch (error) {
    return false;
  }
};
const setupFolder = async (path) => {
  const folderExist = isAccessible(path);

  if (!folderExist) {
    try {
      await fs.mkdir(path);
    } catch (error) {
      console.log(
        "Access denied or error occurred while creating folder:",
        error
      );
      process.exit(1);
    }
  }
};

// middleware to catch error
app.use((req, res, next) => {
  res.status(404).json({ message: "404 - Not found" });
});
app.use((error, req, res, next) => {
  res
    .status(error.status || 500)
    .json({ message: error.message, status: error.status });
});

app.listen(3000, async () => {
  await setupFolder(tempDir);
  await setupFolder(storeImageDir);
  console.log(`Server live on port: ${PORT}`);
});
