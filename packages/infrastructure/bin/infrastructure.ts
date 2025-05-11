// import * as cdk from "aws-cdk-lib";

// import { InfrastructureStack } from "../lib/infrastructure-stack";

// const app = new cdk.App();

// const stageName = "dev";

// new InfrastructureStack(app, `oriola-hub-infra-${stageName}`, {
//   env: {
//     account: process.env.CDK_DEFAULT_ACCOUNT,
//     region: process.env.CDK_DEFAULT_REGION,
//   },
//   stageName,
// });

import { App } from "aws-cdk-lib";
import { PrivateApiStack } from "../lib/private-api-stack";

const app = new App();
new PrivateApiStack(app, "PrivateApiStack", {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT || "402870043355",
    region: process.env.CDK_DEFAULT_REGION || "eu-north-1",
  },
});
