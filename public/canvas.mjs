const canvasWidth = 640;
const canvasHeight = 480;
const playerWidth = 30;
const playerHeight = 30;
const border = 5;
const infoBar = 45; 

const calculations = {
  canvasWidth: canvasWidth,
  canvasHeight: canvasHeight,
  playFieldMinX: (canvasWidth / 2) - (canvasWidth - 10) / 2,
  playFieldMinY: (canvasHeight / 2) - (canvasHeight - 100) / 2,
  playFieldWidth: canvasWidth - (border * 2),
  playFieldHeight: (canvasHeight - infoBar) - (border * 2),
  playFieldMaxX: (canvasWidth - playerWidth) - border,
  playFieldMaxY: (canvasHeight - playerHeight) - border,
}

const starting_position = (min, max, multiple) => {
  return Math.floor(Math.random() * ((max - min) / multiple)) * multiple + min;
};

export {
  starting_position,
  calculations
}