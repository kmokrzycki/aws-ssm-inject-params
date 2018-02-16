# jwt-token-encrypted

This module allows you to generate JSON Web Tokens to encrypt part of its data and decrypt.

## Using module
```javascript
import jwtCrypto from '@trufa/jwt-token-encrypted';
```

## Creating JWT

```javascript
// Data that will be publicly available
let publicData = {
    role: "user"
};

// Data that will only be available to users who know encryption details.
let privateData = {
    email: "user",
    bank: "HSBC",
    pin: "1234",
};

// Encryption settings
let encryption = {
    key: 'AAAAAAAAAAAAAA',
    algorithm: 'aes-256-cbc',
  };

// JWT Settings
let jwtDetails = {
    iss: 'NKInVWhB1rVLCwxltMNuiUC6h9UudAbi',
    data: {
      public: { data1: 1, data2: 2, data3: 3 },
      encData: '5fb8ed70a3864cbd97b25cc8ca2c0bc7',
    }
};

let token = await jwtCrypto.generateJWT(
      jwtDetails,
      publicData,
      encryptionSettings,
      privateData
    );
```

## Reading JWT

``` javascript
// Encryption settings
let encryption = {
    key: 'AAAAAAAAAAAAAA',
    algorithm: 'aes-256-cbc',
  };

const decrypted = jwtCrypto.readJWT(token, encryption);

 ```

 ## Using decrypted data
 
