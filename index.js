import express from "express";
import Jimp from "jimp";
import fs from "fs/promises";
import path from "path";
import multer from "multer";
import { v4 as uuidV4 } from "uuid";
import isImageAndTransform from "./helpers.js";

const PORT = 3000;

const app = express();

app.set("view engine", "ejs");
app.use(express.static("public"));

const tempDir = path.join(process.cwd(), "temp"); //cwdf - current work directory
const storeImageDir = path.join(process.cwd(), "public/images");

// file whitelist - only images
const extensionWhiteList = [".jpg", ".jpeg", ".png", ".bmp", ".gif"];
const mimetypeWhiteList = [
  "imagee/jpg",
  "image/jpeg",
  "image/png",
  "image/bmp",
  "image/gif",
];

// multer storage configuration
const storage = multer.diskStorage({
  // destination - gdzie zapisujemy plik
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    // obsluga bledu oraz generowanie nazwy pliku
    cb(null, `${uuidV4()}.${file.originalname}`);
  },
});

// middleware to handle file upload
const uploadMiddleware = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const extension = path.extname(file.originalname).toLocaleLowerCase();
    const mimetype = file.mimetype;

    if (
      !extensionWhiteList.includes(extension) ||
      !mimetypeWhiteList.includes(mimetype)
    ) {
      return cb(null, false);
    }

    return cb(null, true);
  },
  limits: { fileSize: 1024 * 1024 * 5 }, //5 mb
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

// endpoint to render upload pic
app.get("/uploaded/:imgPath", (req, res) => {
  const imgPath = req.params.imgPath;
  res.render("uploaded", { imgPath });
});

// endpoint to upload image
app.post(
  "/upload",
  uploadMiddleware.single("picture"),
  async (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({ message: "File not provided" });
    }

    // Get the current temporary file path
    const { path: temporaryPath } = req.file;
    // Get the file extension using path.extname
    const extension = path.extname(temporaryPath);
    // Generate a new file name
    const fileName = `${uuidV4()}${extension}`;
    // Define the new file path (public/images)
    const filePath = path.join(storeImageDir, fileName);

    try {
      // Move the file from temp to public/images
      await fs.rename(temporaryPath, filePath);
    } catch (error) {
      await fs.unlink(temporaryPath);
      return next(error);
    }

    // Check if the image is valid and perform any transformations
    const isValidAndTransform = await isImageAndTransform(filePath);
    if (!isValidAndTransform) {
      await fs.unlink(filePath);
      return res
        .status(400)
        .json({ message: "File isnt a photo but is pretending" });
    }
    res.redirect(`/uploaded/${fileName}`);
  }
);

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
