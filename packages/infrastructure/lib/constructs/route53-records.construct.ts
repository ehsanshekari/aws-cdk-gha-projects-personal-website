import * as route53 from "aws-cdk-lib/aws-route53";
import * as targets from "aws-cdk-lib/aws-route53-targets";
import * as cloudfront from "aws-cdk-lib/aws-cloudfront";
import { Construct } from "constructs";

interface WebsiteDnsRecordsProps {
  readonly hostedZone: route53.IHostedZone;
  readonly distribution: cloudfront.Distribution;
  readonly domainName: string;
}

export class WebsiteDnsRecords extends Construct {
  constructor(scope: Construct, id: string, props: WebsiteDnsRecordsProps) {
    super(scope, id);

    new route53.ARecord(this, "WebsiteARecord", {
      zone: props.hostedZone,
      recordName: props.domainName,
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(props.distribution)
      ),
    });

    new route53.AaaaRecord(this, "WebsiteAaaaRecord", {
      zone: props.hostedZone,
      recordName: props.domainName,
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(props.distribution)
      ),
    });
  }
}
