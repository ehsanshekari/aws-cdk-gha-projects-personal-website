#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { CertificateStack } from "../lib/stacks/certificate-stack";
import { InfraStack } from "../lib/stacks/infra-stack";

const domainName = process.env.DOMAIN_NAME || "ehsanshekari.com";
const bucketName =
  process.env.BUCKET_NAME || "ehsan-shekari-258-website-bucket";

const app = new cdk.App();

const certStack = new CertificateStack(app, "CertificateStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: "us-east-1",
  },
  domainName,
});

new InfraStack(app, "InfraStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  domainName,
  bucketName,
  certificateArn: certStack.certificate.certificateArn, // 🔁 pass certificate
});
