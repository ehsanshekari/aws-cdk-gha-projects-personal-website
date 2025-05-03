#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";

import { InfraStack } from "../lib/infra-stack";

const domainName = process.env.DOMAIN_NAME || "ehsanshekari.com";
const bucketName =
  process.env.BUCKET_NAME || "ehsan-shekari-258-website-bucket";

const app = new cdk.App();
// new InfraStack(app, 'InfraStack', {
//   /* If you don't specify 'env', this stack will be environment-agnostic.
//    * Account/Region-dependent features and context lookups will not work,
//    * but a single synthesized template can be deployed anywhere. */

//   /* Uncomment the next line to specialize this stack for the AWS Account
//    * and Region that are implied by the current CLI configuration. */
//   // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

//   /* Uncomment the next line if you know exactly what Account and Region you
//    * want to deploy the stack to. */
//   // env: { account: '123456789012', region: 'us-east-1' },

//   /* For more information, see https://docs.aws.amazon.com/cdk/latest/guide/environments.html */
// });

new InfraStack(app, "InfraStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  domainName: domainName,
  bucketName: bucketName,
});
