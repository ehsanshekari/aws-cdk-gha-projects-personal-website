import * as cdk from "aws-cdk-lib";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as origins from "aws-cdk-lib/aws-cloudfront-origins";
import { Construct } from "constructs";

import { WebsiteCloudFrontDistribution } from "./constructs/cloudfront-distribution";
import { WebsiteDnsRecords } from "./constructs/route53-records";
import { WebsiteACMCertificate } from "./constructs/website-acm-certificate";
import { WebsiteS3Bucket } from "./constructs/website-s3-bucket";

export interface InfraStackProps extends cdk.StackProps {
  domainName: string;
  bucketName: string;
}

export class InfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: InfraStackProps) {
    super(scope, id, props);

    // Look up the hosted zone
    const hostedZone = route53.HostedZone.fromLookup(this, "HostedZone", {
      domainName: props.domainName,
    });

    // Create the S3 bucket
    const websiteBucket = new WebsiteS3Bucket(this, "WebsiteBucket", {
      bucketName: props.bucketName,
    });

    // Create the SSL certificate
    const websiteCertificate = new WebsiteACMCertificate(
      this,
      "WebsiteCertificate",
      {
        domainName: props.domainName,
        hostedZone,
      },
    );

    // Create CloudFront distribution
    const websiteDistribution = new WebsiteCloudFrontDistribution(
      this,
      "WebsiteDistribution",
      {
        domainNames: [props.domainName, `www.${props.domainName}`],
        certificate: websiteCertificate.certificate,
        origin: new origins.S3Origin(websiteBucket.bucket),
      },
    );

    // Create DNS records
    new WebsiteDnsRecords(this, "WebsiteDns", {
      hostedZone,
      distribution: websiteDistribution.distribution,
      domainName: props.domainName,
    });

    // Output the CloudFront URL
    new cdk.CfnOutput(this, "DistributionDomainName", {
      value: websiteDistribution.distribution.distributionDomainName,
    });
  }
}
