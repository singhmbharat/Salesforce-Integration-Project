//Class to connect Salesforce with GCP Function 
// this class is used to get the token via GCP and query the standard apex call 

const functions = require('@google-cloud/functions-framework');
const axios = require('axios');
const fs = require('fs');
const jwt = require('jsonwebtoken');

//salesforce connected App info

const CLIENT_ID ='3MVG9CecKwYCDceTZzsJhEtVrt8VQ9u36CL86vyHi9b4qqKIJpP1dX6Z_1cFrGZeyKS7V_gi16ZW8ddQIvjGq';
const USERNAME = 'bharatgettingbetter@cpq.com';
const LOGIN_URL = 'https://login.salesforce.com';

const privateKey = fs.readFileSync('server.key','utf8');

functions.http('callSalesforce',async (req , res) => {

    try{

        console.log('check1');
        // create JWT
        const token = jwt.sign(
            {
                iss:CLIENT_ID,
                sub: USERNAME,
                aud:LOGIN_URL,
                exp: Math.floor(Date.now()/1000)+300
            },
            privateKey,
            { algorithm: 'RS256' }
        );


         console.log('Generated JWT (first 100 chars):', token.substring(0,100));

    const authResp = await axios.post(`${LOGIN_URL}/services/oauth2/token`, null, {
    params: {
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: token
      },
      validateStatus: () => true 
    });
    
    console.log('Salesforce Auth Response Status:', authResp.status);
    
    console.log('Salesforce Auth Response Data:', authResp.data);


    if (authResp.status !== 200) {
        return res.status(authResp.status).send({
            error: 'Failed to get access token',
            details: authResp.data // This will include Salesforce error like "invalid_grant"
        });
    }

    const accessToken = authResp.data.access_token;
    const instanceUrl = authResp.data.instance_url;

    console.log('accessToken'+accessToken);
    console.log('instanceUrl'+instanceUrl);

    const sfResp = await axios.get(`${instanceUrl}/services/data/v58.0/query/`, {
      params: { q: 'SELECT Id, Name FROM Account LIMIT 5' },
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    console.log('sfResp'+sfResp);
    
    res.status(200).send(sfResp.data.records);



    }catch (err) {
    console.error(err);
    res.status(500).send({ error: err.message });
   }
});

/*functions.http('helloHttp', (req, res) => {
  res.send(`Hello ${req.query.name || req.body.name || 'World'}!`);
});*/


