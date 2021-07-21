/*
relative require
*/'use strict';

import path from 'path';
import Module from 'module';

const modules = {};

const getModule = function(dir) {
  const rootPath = dir ? path.resolve(dir) : process.cwd();
  const rootName = path.join(rootPath, '@root');
  let root = modules[rootName];
  if (!root) {
    root = new Module(rootName);
    root.filename = rootName;
    root.paths = (Module as any)._nodeModulePaths(rootPath);
    modules[rootName] = root;
  }
  return root;
};

export const requireRelative = function(requested, relativeTo) {
  const root = getModule(relativeTo);
  return root.require(requested);
};

requireRelative.resolve = function(requested, relativeTo) {
  const root = getModule(relativeTo);
  return (Module as any)._resolveFilename(requested, root);
};

export default requireRelative;
