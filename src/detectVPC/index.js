const aws = require('aws-sdk');

// TODO: Make it work for all regions!

exports.handler = async () => {
  try {
    console.log(`Beginning VPC detection`);
    await findResources();
  } catch (error) {
    console.log(error);
  }

  // return a 200 response if no errors
  const response = {
    statusCode: 200,
    body: `Done.`
  };

  return response;
};

async function findResources () {
  const cs = new aws.ConfigService();

  const params = {
    ConfigurationAggregatorName: 'vpc-eradicator', /* required */
    ResourceType: 'AWS::EC2::VPC'
  };

  // Use AWS Config to find all VPCs
  const resources = await cs.listAggregateDiscoveredResources(params).promise();
  console.log(resources);

  if (resources.ResourceIdentifiers.length > 0) { // run eradicateResources function only if the resource was found
    let count = resources.ResourceIdentifiers.length === 1 ? 'VPC' : 'VPCs'; // good grammar is important
    console.log(`Oh noes! ${resources.ResourceIdentifiers.length} ${count} discovered! Sending warning email.`);
    // Run eradicateResources function on each instance of that resource
    await sendWarningEmail(resources);
  } else {
    console.log(`No VPCs found here, your money is safe for now!`);
  }
}

// send email
async function sendWarningEmail(resources) {
  try {
    // generate email
    body = await generateEmailBody(resources);
    header = `VPC Warning`;
    // send the email
    console.log(`Sending email to ${process.env.VPC_EMAIL}.`);
    await sendEmail(header, body);
    console.log(`Email sent`);
  } catch (error) {
    console.log(`Error sending email`);
    console.log(error);
  }
}

// make a pretty email body
function generateEmailBody (resources) {
  const header = `<h1>⚠️ VPC Warning ⚠️</h1>`;
  const summary = `
    <div>#️⃣ Number of VPCs found: ${resources.ResourceIdentifiers.length}</div>
  `;

  let instances = '';
  resources.ResourceIdentifiers.forEach(resource => {
    const item = `<li>${resource.ResourceId}</li>`;
    instances = instances + item;
  });

  const style = `
    <style>
      h1, h2, h3, div {font-family: sans-serif;}
    </style>
    `;

  return `
    <html>
      <head>${style}</head>
      <body>
        ${header}
        <div>
          ${summary}
        </div>
        <br/><hr/><br/>
        <div>
          <h3>Instances found:</h3>
          <ul>
            ${instances}
          </ul>
        </div>
      </body>
    </html>
  `;
};

async function sendEmail (subject, body) {
  let params = {
    Destination: {
      ToAddresses: [
        process.env.VPC_EMAIL
      ]
    },
    Message: {
      Body: {
        Html: {
          Charset: 'UTF-8',
          Data: body
        }
      },
      Subject: {
        Charset: 'UTF-8',
        Data: subject
      }
    },
    Source: process.env.VPC_EMAIL
  };

  const ses = new AWS.SES();
  await ses.sendEmail(params).promise();
}
