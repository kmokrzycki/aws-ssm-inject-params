/* eslint-env jest */
const chai = require('chai');
const SsmInject = require('../src/aws-ssm-inject-params');


const { expect } = chai;

describe('Make sure isSmsString captures placeholders strings', () => {
  it('Valid paths are recognized', async () => {
    const result = SsmInject.isSsmString('aws-ssm://this/is/valid/path');
    const expected = [
      'aws-ssm://this/is/valid/path',
      null,
      '/this/is/valid/path',
      null,
    ];
    expect(JSON.stringify(result)).to.equal(JSON.stringify(expected));
  });
  it('Partial values are recognized', async () => {
    const result = SsmInject.isSsmString('aws-ssm://this/is/partial|/path/after/value');
    const expected = [
      'aws-ssm://this/is/partial|/path/after/value',
      null,
      '/this/is/partial',
      '/path/after/value',
    ];
    expect(JSON.stringify(result)).to.equal(JSON.stringify(expected));
  });
  it('Valid JSON paths are recognized', async () => {
    const result = SsmInject.isSsmString('aws-ssm-json://this/is/valid/path');
    const expected = [
      'aws-ssm-json://this/is/valid/path',
      '-json',
      '/this/is/valid/path',
      null,
    ];
    expect(JSON.stringify(result)).to.equal(JSON.stringify(expected));
  });
  it('Partial values are recognized', async () => {
    const result = SsmInject.isSsmString('aws-ssm-json://this/is/partial|/path/after/value');
    const expected = [
      'aws-ssm-json://this/is/partial|/path/after/value',
      '-json',
      '/this/is/partial',
      '/path/after/value',
    ];
    expect(JSON.stringify(result)).to.equal(JSON.stringify(expected));
  });
  it('Invalid paths return nothing', async () => {
    expect(SsmInject.isSsmString('//this/is/valid/path')).to.equal(null);
    expect(SsmInject.isSsmString('ssm://this/is/valid/path')).to.equal(null);
    expect(SsmInject.isSsmString('ssm:/this/is/valid/path')).to.equal(null);
    expect(SsmInject.isSsmString('aws-ssm')).to.equal(null);
    expect(SsmInject.isSsmString('aws-ssm-string')).to.equal(null);
  });
});
