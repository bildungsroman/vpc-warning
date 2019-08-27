# VPC Warning Email Sender

Receive an email when there's a VPC draining funds in your AWS account! Made serverlessly with [Stackery](https://www.stackery.io/).

## Setup

1. Fork and clone this repo (Stackery pro users can just enter the following command: `stackery create -n vpc-warning -p github --github-org <your github username> --blueprint-git-url https://github.com/bildungsroman/vpc-warning/`)

2. You'll need to add your email address to your env params, either in the [Stackery Dashboard](https://app.stackery.io/environments) or with the following command:

```bash
stackery env parameters set -e <your-env-name> vpcEmail <your-email>
```

3. In the AWS Console, navigate to SES/Email Addresses and add and verify the same email address you entered above

4. Deploy to AWS using Stackery CLI by running the following command from the root of your `vpc-warning` repo:

```bash
stackery deploy --interactive-setup
```

5. Sit back and await a warning email once a day should a VPC be found (you can also alter how frequently and when you receive said email by changing the chron expression in the `template.yaml` file)
