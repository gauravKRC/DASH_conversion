const chokidar = require('chokidar');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');

const inputDirectory = './videos/InputVideo';
const outputDirectory = './videos/OutputVideo';

let processedFiles = [];

const watcher = chokidar.watch(inputDirectory, { ignoreInitial: true });

watcher.on('add', convertFile);

function convertFile(filePath) {
  const filename = path.basename(filePath);

  if (filename.endsWith('.mp4') && processedFiles.indexOf(filename) === -1) {
    const inputVideoPath = path.join(inputDirectory, filename);
    const outputPlaylistPath = path.join(outputDirectory, 'playlist.mpd');

    console.log(`Converting ${filename} from path: ${inputVideoPath}...`);

    try {
      ffmpeg(inputVideoPath)
        .outputOptions([
          '-c:v libx264',
          '-c:a aac',
          '-b:v 5000k',
          '-b:a 128k',
          '-s 1280x720',
          '-f dash',
          '-init_seg_name init-$RepresentationID$.$ext$',
          '-media_seg_name seg-$RepresentationID$-$Number%05d$.$ext$',
        ])
        .output(outputPlaylistPath)
        .on('progress', (progress) => {
          console.log(`Progress: ${(progress.percent * 100).toFixed(2)}%`);
        })
        .on('end', () => {
          console.log(`DASH files generated for ${filename}`);
          processedFiles.push(filename);
        })
        .on('error', (err) => {
          console.error(`Error converting ${filename}:`, err.message);
          processedFiles.push(filename);
        })
        .run();
    } catch (error) {
      console.error(`Error converting ${filename}:`, error);
      processedFiles.push(filename);
    }
  }
}

console.log('Watching for changes in', inputDirectory);
