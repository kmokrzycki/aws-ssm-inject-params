import traverse from 'traverse';
import awsParamStore from 'aws-param-store';
import objectPath from 'object-path';

const isSsmStringRegex = /^aws-ssm:\/(\/[\w-]+[^|]*)\|?([^|]+)?/;
const lastPathToken = /(.*?)(\/[^/]+)$/;

const findLastPathKey = path => {
  const matched = path.match(lastPathToken);
  if (matched) {
    return {
      path: matched[1],
      key: matched[2],
      full: path,
    };
  }
  return matched;
};

const cleanupResults = (path, results, levelUp = false) => {
  let newStructure = {};

  results.map(el => {
    const re = new RegExp(`^${path}/?`);
    const elPath = el.Name.replace(re, '');
    if (elPath === '') {
      newStructure = el.Value;
      return true;
    }
    if (!levelUp) {
      objectPath.set(newStructure, elPath.replace('/', '.'), el.Value);
    }
    return true;
  });

  return newStructure;
};

const getSsmValueFromAws = (path) => {
  const result = awsParamStore.newQuery(path).executeSync();
  return result;
};

const pullValueFromSsm = path => {
  const results = getSsmValueFromAws(path);
  if (results.length > 0) return cleanupResults(path, results);

  const subKey = findLastPathKey(path);
  const parentResults = getSsmValueFromAws(subKey.path);
  const cleanResults = cleanupResults(path, parentResults, true);
  if (Object.keys(cleanResults).length === 0) {
    throw new Error(`Path ${path} not found in parameter store!`);
  }
  return cleanResults;
};

const isSsmString = (element) => element.match(isSsmStringRegex);

export default {
  getValuesFromSsm(data) {
    return traverse(data).map(element => {
      if (typeof element === 'string') {
        const match = isSsmString(element);
        if (match) {
          const newValue = pullValueFromSsm(match[1]) || '';
          if (match.length >= 3 && match[2]) {
            return newValue + match[2];
          }
          return newValue;
        }
      }
      return element;
    });
  },
  getSsmValue(path) {
    return getSsmValueFromAws(path);
  },
};

export {
  findLastPathKey,
  cleanupResults,
  pullValueFromSsm,
  isSsmString,
  lastPathToken,
  getSsmValueFromAws,
};

