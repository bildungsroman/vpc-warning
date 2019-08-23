const aws = require('aws-sdk');
const ec2 = new aws.EC2();

let allVpcs = [];

exports.handler = async () => {
  // Get valid VPC regions
  const ec2Regions = await ec2.describeRegions().promise();

  for (let region of ec2Regions.Regions) {
    await findResources(region.RegionName);
  }

  await handleEmail();

  // return a 200 response if no errors
  const response = {
    statusCode: 200,
    body: `Done.`
  };

  return response;
};


async function findResources (region) {
  // we need to find VPCs in one region at a time
  const ec2region = new aws.EC2({region: region});

  let findVpcs = await ec2region.describeVpcs().promise();
  if (findVpcs.Vpcs.length > 0) {
    console.log(findVpcs);
    allVpcs.push({findVpcs});
  } else {
    console.log(`No VPCs found in ${region}`);
  }

};

async function handleEmail() {
  if (allVpcs.length > 0) { // only send email if VPCs found
    let count = allVpcs.length === 1 ? 'VPC' : 'VPCs'; // good grammar is important
    console.log(`Oh noes! ${allVpcs.length} ${count} discovered! Sending warning email.`);
    // send email
    await sendWarningEmail(resources);
  } else {
    console.log(`No VPCs found here, your money is safe for now!`);
  }
};

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
};

// make a pretty email body
function generateEmailBody () {
  const header = `<h1>⚠️ VPC Warning ⚠️</h1>`;
  const summary = `
    <div>#️⃣ Number of VPCs found: ${allVpcs.length}</div>
  `;

  let instances = '';
  allVpcs.forEach(vpc => {
    const item = `<li>${vpc.vpcId}</li> in region ${vpc.region}`;
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

  const ses = new aws.SES();
  await ses.sendEmail(params).promise();
};
