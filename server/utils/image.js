const fs = require('fs');
const junk = require('junk');
const configs = require('../configs');

class ImagesLoader {
  getImages() {
    const previewsList = this.previews;
    const photosList = this.photos;
    const imagesMap = [];

    photosList.forEach(photo => {
      const imageData = {
        photo: this.buildFullPhotoUrl(photo),
        altText: this.getAltText(photo)
      };
      const hasPreview = previewsList.indexOf(photo) !== -1;
      if (hasPreview) {
        imageData.preview = this.buildFullPreviewUrl(photo);
      } else {
        imageData.preview = imageData.photo;
      }
      imagesMap.push(imageData);
    });
    return imagesMap;
  }

  get previews() {
    return fs.readdirSync(configs.PREVIEWS_ABS_PATH).filter(junk.not);
  }

  get photos() {
    return fs.readdirSync(configs.PHOTOS_ABS_PATH).filter(junk.not);
  }

  buildFullPhotoUrl(photoFileName) {
    return `${configs.PHOTOS_REL_PATH}/${photoFileName}`;
  }

  buildFullPreviewUrl(previewFileName) {
    return `${configs.PREVIEWS_REL_PATH}/${previewFileName}`;
  }

  getAltText(photoFileName) {
    // Remove extension
    let altText = photoFileName.split('.');
    altText.pop();

    // Remove index (first part of the name usually)
    altText = altText.join('');
    altText = altText.split('_');
    altText.shift();

    // Replace underscore symbols with spaces
    altText = altText.join(' ');
    altText = altText.charAt(0).toUpperCase() + altText.slice(1);

    return altText;
  }
}

module.exports = {
  ImagesLoader
};