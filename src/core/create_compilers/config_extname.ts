import fs, { constants } from 'fs';
import path from 'path';

export async function access_async(path:fs.PathLike, mode:number|undefined):Promise<void> {
  return new Promise((resolve, reject)=>{
    fs.access(path, mode, err=>{
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    })
  })
}

export async function get_config_extname(cwd) {
  try {
    const input = path.resolve(cwd, 'rollup.config.mjs');
    await access_async(input, constants.F_OK | constants.R_OK);
    return '.mjs';
  } catch (_e) {
    const input = path.resolve(cwd, 'rollup.config.js');
    await access_async(input, constants.F_OK | constants.R_OK);
    return '.cjs';
  }
}
