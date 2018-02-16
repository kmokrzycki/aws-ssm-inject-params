# aws-ssm-inject-params

Module allows to replace elements of object/structure with variables from AWS Parameter Store.

This module is commonly used with Config generation that will make you application deployment simpler as well as independent from deployment environment.

## Install
```bash
npm install aws-ssm-inject-params --save
```

## Usage
```javascript
import awsSsm from 'aws-ssm-inject-params';
```

### Putting **Parameter Store** data into data structure

Prepare object with placeholder starting with: **aws-ssm:/**

```javascript
    const data = {
        apiUrl: 'aws-ssm:///application/message',
        enabled: true,
    }
```

Using the module:
```javascript
    const dataWithValue = awsSsm.getValuesFromSsm(data);
    console.log(dataWithValue);
```

should print you data structure as below:
```javascript
    {
        apiUrl: 'Hello AWS-SSM World !',
        enabled: true
    }
```

### Prepare data in AWS with AWS CLI:

#### Adding new parameter:
```bash
aws ssm put-parameter --name '/application/message' --value 'Hello AWS-SSM World !'  --type 'String'
```

#### Reading new parameter:
```bash
aws ssm get-parameters --names "/application/message"
{
    "Parameters": [
        {
            "Name": "/application/message",
            "Type": "String",
            "Value": "Hello AWS-SSM World !"
        }
    ],
    "InvalidParameters": []
}
```
## Troubleshooting
### Missing region in config
Please export AWS Region
```bash
export AWS_REGION='eu-west-1'
```
or if your system already has AWS_DEFAULT_REGION
```bash
export AWS_REGION=$AWS_DEFAULT_REGION
```

