/* eslint-env jest */
/* no-template-curly-in-string */
import chai from 'chai';
import * as SsmInject from '../src/aws-ssm-inject-params';

const { expect } = chai;

describe('Make sure isSmsString captures placeholders strings', () => {
  it('Valid paths are recognized', async () => {
    const result = SsmInject.isSsmString('aws-ssm://this/is/valid/path');
    const expected = [
      'aws-ssm://this/is/valid/path',
      '/this/is/valid/path',
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
