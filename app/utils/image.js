const cloudinary = require('cloudinary').v2;

class ImagesLoader {
  async getImages(options = {}) {
    const data = await cloudinary.search
      .expression('folder:photos')
      .with_field('context')
      .sort_by('public_id', 'desc')
      .max_results(90)
      .execute();
    const images = data.resources.map((res) => {
      return {
        photo: res.secure_url,
        altText: this.getAltText(res),
        preview: this.getPreviewUrl(res)
      };
    });
    return this.structureItems(images, options.itemsInRow);
  }

  structureItems(items, itemsInRow) {
    const structuredItems = [];
    let row = [];
    items.forEach((selectedItem) => {
      row.push(selectedItem);
      if (row.length === itemsInRow) {
        structuredItems.push(row);
        row = [];
      }
    });
    if (row.length) {
      structuredItems.push(row);
    }
    return structuredItems;
  }

  getPreviewUrl(res) {
    let transformationType;
    if (res.width < res.height) {
      transformationType = 'tall-photos-preview';
    } else {
      transformationType = 'wide-photos-preview';
    }
    return cloudinary.url(res.public_id, {
      transformation: [transformationType]
    });
  }

  getAltText(res) {
    return res.context && res.context.alt;
  }
}

module.exports = {
  ImagesLoader
};