import React from 'react';
import Lightbox from "yet-another-react-lightbox";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";
import "./ImageLightbox.css"; // Make sure to import the CSS file

const ImageLightbox = ({ open, close, slides, index }) => {
  console.log('ImageLightbox slides:', slides);
  console.log('ImageLightbox slides length:', slides.length);

  return (
    <Lightbox
      open={open}
      close={close}
      slides={slides}
      index={index}
      plugins={[Thumbnails]}
      thumbnails={{
        position: "bottom",
        width: 120,
        height: 80,
        border: 0,
        borderRadius: 8,
        padding: 0,
        gap: 16,
      }}
      styles={{
        container: {
          paddingTop: "50px",
          backgroundColor: "rgba(0, 0, 0, 0.8)",
        },
        slide: {
          width: '100%',
          height: 'calc(100% - 150px)',
        },
        thumbnailsContainer: {
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          padding: "10px 0",
        },
        thumbnail: {
          border: 'none',
          borderRadius: 8,
          overflow: 'hidden',
        },
      }}
      carousel={{
        finite: true, // Set to true to make the carousel finite
        preload: 1,
        padding: 0,
        spacing: 0,
      }}
      render={{
        buttonPrev: slides.length > 1 ? undefined : () => null,
        buttonNext: slides.length > 1 ? undefined : () => null,
        iconPrev: slides.length > 1 ? undefined : () => null,
        iconNext: slides.length > 1 ? undefined : () => null,
      }}
    />
  );
};

export default ImageLightbox;
