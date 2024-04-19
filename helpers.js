import fs from "fs/promises";
import Jimp from "jimp";

const MAX_AVATAR_WIDTH = 512;
const MAX_AVATAR_HEIGHT = 512;

const isImageAndTransform = async (path) => {
  return new Promise((resolve) => {
    Jimp.read(path, async (err, image) => {
      if (err) {
        resolve(false);
      }

      try {
        //pobieramy wymiary obrazka
        const w = image.getWidth();
        const h = image.getHeight();

        // sprawdzamy czy obrazek jest mniejszy niz 512x512
        // jesli tak to nie robimy nic
        const cropWidth = w > MAX_AVATAR_WIDTH ? MAX_AVATAR_WIDTH : w;
        const cropHeight = h > MAX_AVATAR_HEIGHT ? MAX_AVATAR_HEIGHT : h;

        // obliczamy srodek obrazka
        const centerX = Math.round(w / 2 - cropWidth / 2);
        const centerY = Math.round(h / 2 - cropHeight / 2);

        await image
          .rotate(360) // rotate image by 360 degrees - only pictures can be rotated
          .crop(
            //obcinamy ramke dookola obrazka
            centerX < 0 ? 0 : centerX,
            centerY < 0 ? 0 : centerY,
            cropWidth,
            cropHeight
          )
          .sepia()
          .write(path);
        resolve(true);
      } catch (error) {
        console.log(error);
        resolve(false);
      }
    });
  });
};

export default isImageAndTransform;
