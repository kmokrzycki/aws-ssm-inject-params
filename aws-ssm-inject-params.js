const traverse = require('traverse');
const awsParamStore = require('aws-param-store');
const objectPath = require('object-path');

const isSsmStringRegex = /^aws-ssm(-json)?:\/(\/[\w-]+[^|]*)\|?([^|]+)?/;
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

const getSsmValueFromAws = path => {
  const result = awsParamStore.newQuery(path).executeSync();
  return result;
};

const pullValueFromSsm = path => {
  const results = getSsmValueFromAws(path);
  if (results.length > 0) {
    return cleanupResults(path, results);
  }

  const subKey = findLastPathKey(path);
  const parentResults = getSsmValueFromAws(subKey.path);
  const cleanResults = cleanupResults(path, parentResults, true);
  if (Object.keys(cleanResults).length === 0) {
    throw new Error(`Path ${path} not found in parameter store!`);
  }
  return cleanResults;
};

const isSsmString = element => element.match(isSsmStringRegex);

const getValuesFromSsm = data => traverse(data).map(element => {
  if (typeof element === 'string') {
    const match = isSsmString(element);
    if (match) {
      const newValue = pullValueFromSsm(match[2]) || '';
      if (match.length >= 4 && match[3]) {
        return newValue + match[3];
      }

      if (match[1]) {
        try {
          const parsed = JSON.parse(newValue);

          if (parsed.key === 'true' || parsed.key === 'false') {
            return {
              key: parsed.key === 'true',
            };
          }
          return parsed;
        } catch (e) {
          throw new Error(`Could not JSON parse ${match[2]} => ${newValue}`);
        }
      }
      return newValue;
    }
  }
  return element;
});

module.exports = {
  getValuesFromSsm,
  isSsmString,
  pullValueFromSsm,
  findLastPathKey,
  cleanupResults,
};
