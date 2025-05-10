import * as cdk from "aws-cdk-lib";

import { InfrastructureStack } from "../lib/infrastructure-stack";

const app = new cdk.App();

const stageName = "dev";

new InfrastructureStack(app, `oriola-hub-infra-${stageName}`, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  stageName,
});
