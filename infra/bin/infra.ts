#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";

import { InfraStack } from "../lib/infra-stack";

const domainName = process.env.DOMAIN_NAME || "ehsanshekari.com";
const bucketName =
  process.env.BUCKET_NAME || "ehsan-shekari-258-website-bucket";

const app = new cdk.App();

new InfraStack(app, "InfraStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  domainName: domainName,
  bucketName: bucketName,
});
