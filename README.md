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
        apiUrl: 'aws-ssm://application/message',
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

### Partial replacement

Prepare object with placeholder starting with: **aws-ssm:/** and separating parameter store part with suffix  by **|**
e.g.
```javascript
    const data = {
        apiUrl: 'aws-ssm://my-service/host|/user/details',
        enabled: true,
    }
```

presuming aws-ssm://my-service/host is defined  and equals to:

http://superuser.org

result will be:
```javascript
    const data = {
        apiUrl: 'http://superuser.org/user/details',
        enabled: true,
    }
```

### JSON parsing

Prepare object with placeholder starting with: **aws-ssm-json:/**
e.g.
```javascript
    const data = {
        apiUrl: 'aws-ssm-json://my-service/json-serialized-object',
        enabled: true,
    }
```

presuming /my-service/json-serialized-objec is a valid JSON object:

```javascript
'{"intValue": 123, "stringValue": "value", "list": [1,2,3,4,5]}'
```

If string is not a valid JSON string error is thrown:
```javascript
Could not JSON parse /my-service/json-serialized-object => {"intValue": 123
```

### Missing parameter throws error !

If given placeholder cannot be found in parameter store exception is thrown:

```javascript
    const data = {
        apiUrl: 'aws-ssm://no/such/value',
        enabled: true,
    }
```
 will throw below Error:
 ```
 Path /no/such/value not found in parameter store!'
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



