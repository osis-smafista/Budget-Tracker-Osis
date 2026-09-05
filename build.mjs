import { cp, mkdir, rm } from 'node:fs/promises';


await rm(
  'dist',
  {
    recursive: true,
    force: true
  }
);


await mkdir(
  'dist',
  {
    recursive: true
  }
);


/* =========================================
   COPY FILE UTAMA
========================================= */

for (
  const file of [
    'index.html',
    'style.css',
    'script.js'
  ]
) {

  await cp(
    file,
    `dist/${file}`
  );

}


/* =========================================
   COPY ASSETS
========================================= */

await cp(
  'assets',
  'dist/assets',
  {
    recursive: true
  }
);


console.log(
  'Build berhasil!'
);