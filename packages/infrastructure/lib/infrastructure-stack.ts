import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as route53 from "aws-cdk-lib/aws-route53";
import { Certificate } from "aws-cdk-lib/aws-certificatemanager";

import { configuration, StageType } from "../config/constants";
import { LambdaConstruct } from "./constructs/lambda.construct";
import { ApiGatewayConstruct } from "./constructs/api-gateway.construct";
import { WebAppS3BucketConstruct } from "./constructs/s3-bucket.constructs";
import { CloudfrontConstruct } from "./constructs/cloudfront-distro.construct";
import { ApiGatewayReginalACMCertificate } from "./constructs/acm-certificate.construct";
import { WebsiteDnsRecords } from "./constructs/route53-records.construct";

interface InfrastructureStackProps extends cdk.StackProps {
  stageName: StageType;
}

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: InfrastructureStackProps) {
    super(scope, id, props);

    const { stageName } = props;

    // deploy can also fetch and pass this part?
    const config = configuration[stageName];

    if (!config) {
      throw new Error(`Missing configuration for stage: ${stageName}`);
    }

    const { CERTIFICATE_ARN, DOMAIN_NAME } = config;

    const hostedZone = route53.HostedZone.fromLookup(this, "HostedZone", {
      domainName: DOMAIN_NAME,
    });

    //  The Certificate of the Reginal based API Gateway needs to be in the same region
    const apiGatewayCert = new ApiGatewayReginalACMCertificate(
      this,
      "ReginalGatewayACM",
      {
        domainName: DOMAIN_NAME,
        hostedZone,
      }
    );

    const lambdaConstruct = new LambdaConstruct(this, "HubLambdasApis", {
      stageName,
      region: props.env?.region!,
    });

    const apiGateway = new ApiGatewayConstruct(this, "HubPublicApiGateway", {
      stageName,
      apis: {
        signUpLambda: lambdaConstruct.signUpHandler,
        loginLambda: lambdaConstruct.loginHandler,
        logoutLambda: lambdaConstruct.logoutHandler,
      },
      apiDomainName: DOMAIN_NAME,
      certificate: apiGatewayCert.certificate,
    });

    const clientS3Bucket = new WebAppS3BucketConstruct(
      this,
      "HubWebAppS3Bucket",
      {
        stageName,
      }
    );

    const certificate = Certificate.fromCertificateArn(
      this,
      "Certificate",
      CERTIFICATE_ARN
    );

    const distro = new CloudfrontConstruct(this, "HubWebAppDistribution", {
      domainName: DOMAIN_NAME,
      certificate,
      bucket: clientS3Bucket.bucket,
      apiDomainName: apiGateway.apiDomain,
      stageName: stageName,
    });

    new WebsiteDnsRecords(this, "WebsiteDnsRecords", {
      hostedZone,
      distribution: distro.distribution,
      domainName: DOMAIN_NAME,
    });
  }
}
