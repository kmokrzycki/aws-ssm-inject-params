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
  it('Paths with env placeholders are recognized', async () => {
    const result = SsmInject.isSsmString('aws-ssm://this/is/${ENV_SERVICE}/path');
    const expected = [
      'aws-ssm://this/is/${ENV_SERVICE}/path',
      '/this/is/${ENV_SERVICE}/path',
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
  it('Path with env placeholders should match', async () => {
    process.env.ENV_TEST = 'test_value';
    expect(SsmInject.replaceEnvPlaceholder('/this/${ENV_TEST}/valid/path'))
      .to.equal('/this/test_value/valid/path');
  });
  it('Path with non existing env placeholders should error', async () => {
    const throwFunction = () => {
      SsmInject.replaceEnvPlaceholder('/this/${NOT_IN_ENV}/valid/path');
    };
    expect(throwFunction).to.throw(Error);
  });
});
