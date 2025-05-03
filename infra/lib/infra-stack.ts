import * as cdk from "aws-cdk-lib";
import * as route53 from "aws-cdk-lib/aws-route53";
import { Construct } from "constructs";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import { WebsiteCloudFrontDistribution } from "./constructs/cloudfront-distribution";
import { WebsiteDnsRecords } from "./constructs/route53-records";
import { WebsiteACMCertificate } from "./constructs/website-acm-certificate";
import { WebsiteS3Bucket } from "./constructs/website-s3-bucket";

export interface InfraStackProps extends cdk.StackProps {
  readonly domainName: string;
  readonly bucketName: string;
}

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: InfraStackProps) {
    super(scope, id, props);

    // Get hosted zone
    const hostedZone = route53.HostedZone.fromLookup(this, "HostedZone", {
      domainName: props.domainName,
    });

    // Create S3 bucket
    const websiteBucket = new WebsiteS3Bucket(this, "WebsiteBucket", {
      bucketName: props.bucketName,
    });

    // Create ACM certificate
    const certificate = new WebsiteACMCertificate(this, "WebsiteCertificate", {
      domainName: props.domainName,
      hostedZone,
    });

    // Create CloudFront distribution
    const distribution = new WebsiteCloudFrontDistribution(
      this,
      "WebsiteDistribution",
      {
        domainNames: [props.domainName, `www.${props.domainName}`],
        certificate: certificate.certificate,
        origin: new origins.S3StaticWebsiteOrigin(websiteBucket.bucket),
      },
    );

    // Create DNS records
    new WebsiteDnsRecords(this, "WebsiteDnsRecords", {
      hostedZone,
      distribution: distribution.distribution,
      domainName: props.domainName,
    });
  }
}
