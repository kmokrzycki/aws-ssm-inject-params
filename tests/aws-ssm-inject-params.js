/* eslint-env jest */
import chai from 'chai';
import sinon from 'sinon';
import awsParamStore from 'aws-param-store';
import * as SsmInject from '../src/aws-ssm-inject-params';

const { expect } = chai;

describe('findLastPathKey last path key from', () => {
  it('Find should return path and last element separated', async () => {
    const path = '/a/b/c/d';
    const found = SsmInject.findLastPathKey(path);
    const expected = { path: '/a/b/c', key: '/d', full: '/a/b/c/d' };
    expect(found).to.deep.equal(expected);
  });
});

describe('Build structure from SSM', () => {
  let sandbox;
  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    const newQuery = sandbox.stub(awsParamStore, 'newQuery');
    newQuery.withArgs('/test/path/me1').returns({
      executeSync: () =>
        [{
          Name: '/test/path/me1',
          Type: 'String',
          Value: 'value1',
          Version: 3,
        }],
    });
    newQuery.withArgs('/test/path/me2').returns({
      executeSync: () =>
        [{
          Name: '/test/path/me2',
          Type: 'String',
          Value: 'value2',
          Version: 3,
        }],
    });
    newQuery.withArgs('/test/complex/path').returns({
      executeSync: () =>
        [{
          Name: '/test/complex/path/element1',
          Type: 'String',
          Value: 'Element1',
          Version: 2,
        },
        {
          Name: '/test/complex/path/element2',
          Type: 'String',
          Value: 'Element2',
          Version: 3,
        }],
    });
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('Test value extracted from aws response.', () => {
    const result = SsmInject.pullValueFromSsm('/test/path/me1');
    expect(result).to.deep.equal('value1');
  });

  it('Data with  extracted from aws response.', () => {
    const data = {
      value1: 'aws-ssm://test/path/me1',
      value2: 'aws-ssm://test/path/me2',
      value3: 'value-not-aws-3',
    };

    const expected = {
      value1: 'value1',
      value2: 'value2',
      value3: 'value-not-aws-3',
    };

    const result = SsmInject.default.getValuesFromSsm(data);
    expect(result).to.deep.equal(expected);
  });

  it('Test value extracted from aws response.', () => {
    const result = SsmInject.default.getValuesFromSsm('aws-ssm://test/complex/path');
    const expectedComplex = {
      element1: 'Element1',
      element2: 'Element2',
    };

    expect(result).to.deep.equal(expectedComplex);
  });
});

describe('cleanupResults brings only values matching path same level', () => {
  it('Invalid paths return nothing', async () => {
    const results = [{
      Name: '/this/is/path1',
      Type: 'String',
      Value: '1',
      Version: 2,
    },
    {
      Name: '/this/is/path2',
      Type: 'String',
      Value: '2',
      Version: 3,
    }];
    const result = SsmInject.cleanupResults('/this/is', results);
    const expected = { path1: '1', path2: '2' };

    expect(result).to.deep.equal(expected);
  });
});

describe('cleanupResults brings only values matching path level up', () => {
  it('Invalid paths return nothing', async () => {
    const results = [{
      Name: '/this/is/path',
      Type: 'String',
      Value: 'one',
      Version: 2,
    },
    {
      Name: '/this/is',
      Type: 'String',
      Value: 'two',
      Version: 3,
    }];
    const result = SsmInject.cleanupResults('/this/is/path', results, true);

    expect(result).to.deep.equal('one');
  });
});

describe('throw error whenever value missing in parameter store', () => {
  let sandbox;

  const wrongPath = '/this/wrong/path';

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    const newQuery = sandbox.stub(awsParamStore, 'newQuery');
    newQuery.withArgs(wrongPath).returns({
      executeSync: () => [],
    });
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('Invalid paths throws error', async () => {
    const throwFunction = () => {
      SsmInject.getValuesFromSsm({ one: `aws-ssm:/${wrongPath}` });
    };

    expect(throwFunction).to.throw(Error);
  });
});
