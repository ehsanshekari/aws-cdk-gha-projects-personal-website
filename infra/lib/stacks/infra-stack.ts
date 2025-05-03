import * as cdk from "aws-cdk-lib";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import { Construct } from "constructs";
import { WebsiteS3Bucket } from "../constructs/website-s3-bucket";
import { WebsiteCloudFrontDistribution } from "../constructs/cloudfront-distribution";
import { WebsiteDnsRecords } from "../constructs/route53-records";

interface InfraStackProps extends cdk.StackProps {
  readonly domainName: string;
  readonly bucketName: string;
  readonly certificateArn: string;
}

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: InfraStackProps) {
    super(scope, id, props);

    const hostedZone = route53.HostedZone.fromLookup(this, "HostedZone", {
      domainName: props.domainName,
    });

    const websiteBucket = new WebsiteS3Bucket(this, "WebsiteBucket", {
      bucketName: props.bucketName,
    });

    const certificate = acm.Certificate.fromCertificateArn(
      this,
      "ImportedCertificate",
      props.certificateArn,
    );

    const distribution = new WebsiteCloudFrontDistribution(
      this,
      "WebsiteDistribution",
      {
        domainNames: [props.domainName, `www.${props.domainName}`],
        certificate,
        origin: new origins.S3StaticWebsiteOrigin(websiteBucket.bucket),
      },
    );

    new WebsiteDnsRecords(this, "WebsiteDnsRecords", {
      hostedZone,
      distribution: distribution.distribution,
      domainName: props.domainName,
    });
  }
}
