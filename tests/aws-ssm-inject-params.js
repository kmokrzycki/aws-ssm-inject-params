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
    newQuery.withArgs('/test/path/me3').returns({
      executeSync: () =>
        [{
          Name: '/test/path/me3',
          Type: 'String',
          Value: '{"key": "value"}',
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
      value3: 'aws-ssm-json://test/path/me3',
      value4: 'value-not-aws-4',
    };

    const expected = {
      value1: 'value1',
      value2: 'value2',
      value3: {
        key: 'value',
      },
      value4: 'value-not-aws-4',
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

describe('support partial values in parameter store', () => {
  it('Test value extracted from aws response.', () => {
    const sandbox = sinon.sandbox.create();
    const newQuery = sandbox.stub(awsParamStore, 'newQuery');
    newQuery.returns({
      executeSync: () =>
        [{
          Name: '/test/domain',
          Type: 'String',
          Value: 'http://my.domain.org',
          Version: 3,
        }],
    });

    const result = SsmInject.default.getValuesFromSsm('aws-ssm://test/domain|/service/path');
    expect(result).to.deep.equal('http://my.domain.org/service/path');
    sandbox.restore();
  });
});

describe('Support JSON values', () => {
  it('Test JSON value extracted from aws response.', () => {
    const sandbox = sinon.sandbox.create();
    const newQuery = sandbox.stub(awsParamStore, 'newQuery');
    newQuery.returns({
      executeSync: () =>
        [{
          Name: '/test/object',
          Type: 'String',
          Value: '{"key": 123}',
          Version: 3,
        }],
    });

    const result = SsmInject.default.getValuesFromSsm('aws-ssm-json://test/object');
    expect(result).to.deep.equal({ key: 123 });
    sandbox.restore();
  });

  it('Test JSON boolean value extracted from aws response.', () => {
    const sandbox = sinon.sandbox.create();
    const newQuery = sandbox.stub(awsParamStore, 'newQuery');
    newQuery.returns({
      executeSync: () =>
        [{
          Name: '/test/bool',
          Type: 'String',
          Value: '{"key": "true"}',
          Version: 3,
        }],
    });

    const result = SsmInject.default.getValuesFromSsm('aws-ssm-json://test/bool');
    expect(result).to.deep.equal({ key: true });
    sandbox.restore();
  });

  it('Test JSON boolean false value extracted from aws response.', () => {
    const sandbox = sinon.sandbox.create();
    const newQuery = sandbox.stub(awsParamStore, 'newQuery');
    newQuery.returns({
      executeSync: () =>
        [{
          Name: '/test/bool',
          Type: 'String',
          Value: '{"key": "false"}',
          Version: 3,
        }],
    });

    const result = SsmInject.default.getValuesFromSsm('aws-ssm-json://test/bool');
    expect(result).to.deep.equal({ key: false });
    sandbox.restore();
  });

  it('Throw Error if extracted value is not correct JSON format.', () => {
    const sandbox = sinon.sandbox.create();
    const newQuery = sandbox.stub(awsParamStore, 'newQuery');
    newQuery.returns({
      executeSync: () =>
        [{
          Name: '/test/object',
          Type: 'String',
          Value: '{"key": 123',
          Version: 3,
        }],
    });

    let errorMessage;
    try {
      SsmInject.default.getValuesFromSsm('aws-ssm-json://test/object');
    } catch (error) {
      errorMessage = error.message;
    }
    expect(errorMessage).to.deep.include('Could not JSON parse /test/object');
    sandbox.restore();
  });
});

